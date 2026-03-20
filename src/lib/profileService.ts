import { supabase } from "@/lib/supabase";

export type AppRole = "master_admin" | "admin" | "user";

export interface ProfileRecord {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  website: string | null;
  role: AppRole;
  created_by_admin_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchMyProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,username,full_name,avatar_url,website,role,created_by_admin_id,created_at,updated_at")
    .eq("id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return data as ProfileRecord;
}

export async function fetchProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,username,full_name,avatar_url,website,role,created_by_admin_id,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ProfileRecord[];
}

export async function createAdminAccount(payload: {
  email: string;
  password: string;
  fullName?: string;
  username?: string;
  role?: Extract<AppRole, "admin">;
}) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session?.access_token) {
    throw new Error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại bằng tài khoản master admin.");
  }

  const { data, error } = await supabase.functions.invoke("create-admin-account", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: {
      email: payload.email,
      password: payload.password,
      fullName: payload.fullName ?? null,
      username: payload.username ?? null,
      role: payload.role ?? "admin",
    },
  });

  if (error) {
    const message =
      error instanceof Error && error.message.includes("non-2xx status code")
        ? "Không thể tạo admin con. Hãy kiểm tra lại quyền master admin, session đăng nhập và Edge Function remote."
        : error.message;
    throw new Error(message);
  }

  return data;
}
