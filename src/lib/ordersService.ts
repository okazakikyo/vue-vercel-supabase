import { supabase } from "@/lib/supabase";

export interface OrderUserInput {
  name: string;
  price: number;
}

export interface OrderUser extends OrderUserInput {
  id?: string;
  discount: number;
  final: number;
}

export interface OrderRecord {
  id: string;
  user_id?: string;
  date: string;
  shop: string;
  url: string | null;
  total_before: number;
  total_after: number;
  users: OrderUser[];
  created_at?: string;
  updated_at?: string;
}

export interface OrderPayload {
  date: string;
  shop: string;
  url?: string | null;
  total_before: number;
  total_after: number;
  users: OrderUserInput[];
}

type SupabaseOrderItemRow = {
  id: string;
  order_id: string;
  item_user_name: string;
  price: number;
  discount: number | null;
  final_price: number;
  created_at: string;
};

type SupabaseOrderRow = {
  id: string;
  user_id: string;
  order_date: string;
  shop_name: string;
  shop_url: string | null;
  total_before_discount: number;
  total_after_discount: number;
  created_at: string;
  updated_at: string;
  order_items?: SupabaseOrderItemRow[];
};

function roundThousand(value: number): number {
  return Math.max(0, Math.floor(value / 1000) * 1000);
}

export function calculateOrderUsers(
  rawUsers: OrderUserInput[],
  totalBefore: number,
  totalAfter: number,
): { users: OrderUser[]; total_before: number; total_after: number } {
  const sanitizedUsers = rawUsers
    .map((user) => ({
      name: user.name.trim() || "-",
      price: roundThousand(Number(user.price) || 0),
    }))
    .filter((user) => user.name || user.price > 0);

  const sumPrices = sanitizedUsers.reduce((sum, user) => sum + user.price, 0);
  const normalizedBefore = roundThousand(Number(totalBefore) || sumPrices);
  const normalizedAfter = roundThousand(Number(totalAfter) || normalizedBefore);
  const totalDiscount = Math.max(0, normalizedBefore - normalizedAfter);

  if (sanitizedUsers.length === 0) {
    return {
      users: [],
      total_before: normalizedBefore,
      total_after: normalizedAfter,
    };
  }

  const discountPerUser =
    totalDiscount > 0 ? roundThousand(Math.floor(totalDiscount / sanitizedUsers.length)) : 0;

  return {
    total_before: normalizedBefore,
    total_after: normalizedAfter,
    users: sanitizedUsers.map((user) => ({
      name: user.name,
      price: user.price,
      discount: discountPerUser,
      final: Math.max(0, roundThousand(user.price - discountPerUser)),
    })),
  };
}

export function validateOrderPayload(payload: OrderPayload): string | null {
  if (!payload.date) {
    return "Vui long chon ngay dat.";
  }

  if (payload.total_after > payload.total_before) {
    return "Tong da giam khong the lon hon tong chua giam.";
  }

  const hasUser = payload.users.some(
    (user) => user.name.trim() !== "" || (Number(user.price) || 0) > 0,
  );

  if (!hasUser) {
    return "Them it nhat mot nguoi voi gia hop le.";
  }

  return null;
}

function mapOrder(row: SupabaseOrderRow): OrderRecord {
  return {
    id: row.id,
    user_id: row.user_id,
    date: row.order_date,
    shop: row.shop_name,
    url: row.shop_url,
    total_before: row.total_before_discount,
    total_after: row.total_after_discount,
    created_at: row.created_at,
    updated_at: row.updated_at,
    users: (row.order_items ?? [])
      .map((item) => ({
        id: item.id,
        name: item.item_user_name,
        price: item.price,
        discount: item.discount ?? 0,
        final: item.final_price,
      }))
      .sort((left, right) => left.name.localeCompare(right.name, "vi")),
  };
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("Ban can dang nhap de thao tac don hang.");
  }

  return user.id;
}

async function replaceOrderItems(orderId: string, users: OrderUser[]) {
  const { error: deleteError } = await supabase.from("order_items").delete().eq("order_id", orderId);
  if (deleteError) {
    throw deleteError;
  }

  if (users.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("order_items").insert(
    users.map((user) => ({
      order_id: orderId,
      item_user_name: user.name,
      price: user.price,
      discount: user.discount,
      final_price: user.final,
    })),
  );

  if (insertError) {
    throw insertError;
  }
}

async function fetchOrderById(orderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("id,user_id,order_date,shop_name,shop_url,total_before_discount,total_after_discount,created_at,updated_at,order_items(*)")
    .eq("id", orderId)
    .single();

  if (error) {
    throw error;
  }

  return mapOrder(data as SupabaseOrderRow);
}

export async function fetchOrders(fromDate?: string, toDate?: string) {
  let query = supabase
    .from("orders")
    .select("id,user_id,order_date,shop_name,shop_url,total_before_discount,total_after_discount,created_at,updated_at,order_items(*)")
    .order("order_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (fromDate) {
    query = query.gte("order_date", fromDate);
  }

  if (toDate) {
    query = query.lte("order_date", toDate);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapOrder(row as SupabaseOrderRow));
}

export async function createOrder(payload: OrderPayload) {
  const validationError = validateOrderPayload(payload);
  if (validationError) {
    throw new Error(validationError);
  }

  const userId = await getCurrentUserId();
  const normalized = calculateOrderUsers(payload.users, payload.total_before, payload.total_after);

  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      order_date: payload.date,
      shop_name: payload.shop.trim(),
      shop_url: payload.url?.trim() || null,
      total_before_discount: normalized.total_before,
      total_after_discount: normalized.total_after,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  try {
    await replaceOrderItems(data.id, normalized.users);
    return await fetchOrderById(data.id);
  } catch (replaceError) {
    await supabase.from("orders").delete().eq("id", data.id);
    throw replaceError;
  }
}

export async function updateOrder(orderId: string, payload: OrderPayload) {
  const validationError = validateOrderPayload(payload);
  if (validationError) {
    throw new Error(validationError);
  }

  const normalized = calculateOrderUsers(payload.users, payload.total_before, payload.total_after);

  const { error } = await supabase
    .from("orders")
    .update({
      order_date: payload.date,
      shop_name: payload.shop.trim(),
      shop_url: payload.url?.trim() || null,
      total_before_discount: normalized.total_before,
      total_after_discount: normalized.total_after,
    })
    .eq("id", orderId);

  if (error) {
    throw error;
  }

  await replaceOrderItems(orderId, normalized.users);
  return await fetchOrderById(orderId);
}

export async function deleteOrder(orderId: string) {
  const { error } = await supabase.from("orders").delete().eq("id", orderId);
  if (error) {
    throw error;
  }
}

export async function deleteOrders(orderIds: string[]) {
  if (orderIds.length === 0) {
    return;
  }

  const { error } = await supabase.from("orders").delete().in("id", orderIds);
  if (error) {
    throw error;
  }
}

export async function importOrders(payloads: OrderPayload[]) {
  const createdOrders: OrderRecord[] = [];

  for (const payload of payloads) {
    const order = await createOrder(payload);
    createdOrders.push(order);
  }

  return createdOrders;
}

