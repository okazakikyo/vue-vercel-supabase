import { computed, reactive, ref } from "vue";

import {
  createOrder,
  deleteOrder,
  deleteOrders,
  fetchOrders,
  importOrders,
  updateOrder,
  type OrderPayload,
  type OrderRecord,
} from "@/lib/ordersService";

export function useOrders() {
  const orders = ref<OrderRecord[]>([]);
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);

  const filterDates = reactive({
    from: "",
    to: "",
  });

  const selectedOrderIds = ref<Set<string>>(new Set());

  const filteredOrders = computed(() =>
    orders.value.filter((order) => {
      if (filterDates.from && order.date < filterDates.from) return false;
      if (filterDates.to && order.date > filterDates.to) return false;
      return true;
    }),
  );

  const isAllSelected = computed(() => {
    if (filteredOrders.value.length === 0) {
      return false;
    }

    return filteredOrders.value.every((order) => selectedOrderIds.value.has(order.id));
  });

  const isSomeSelected = computed(
    () => selectedOrderIds.value.size > 0 && filteredOrders.value.some((order) => selectedOrderIds.value.has(order.id)),
  );

  async function loadOrders() {
    loading.value = true;
    error.value = null;

    try {
      orders.value = await fetchOrders(filterDates.from || undefined, filterDates.to || undefined);
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Khong the tai danh sach don hang.";
    } finally {
      loading.value = false;
    }
  }

  async function addOrder(payload: OrderPayload) {
    saving.value = true;
    error.value = null;

    try {
      const created = await createOrder(payload);
      orders.value = [created, ...orders.value].sort((left, right) => right.date.localeCompare(left.date));
      return created;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Khong the tao don hang.";
      return null;
    } finally {
      saving.value = false;
    }
  }

  async function updateOrderData(orderId: string, payload: OrderPayload) {
    saving.value = true;
    error.value = null;

    try {
      const updated = await updateOrder(orderId, payload);
      orders.value = orders.value
        .map((order) => (order.id === orderId ? updated : order))
        .sort((left, right) => right.date.localeCompare(left.date));
      return updated;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Khong the cap nhat don hang.";
      return null;
    } finally {
      saving.value = false;
    }
  }

  async function deleteOrderData(orderId: string) {
    error.value = null;

    try {
      await deleteOrder(orderId);
      orders.value = orders.value.filter((order) => order.id !== orderId);
      selectedOrderIds.value.delete(orderId);
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Khong the xoa don hang.";
      return false;
    }
  }

  async function deleteMultipleOrders(orderIds: string[]) {
    error.value = null;

    try {
      await deleteOrders(orderIds);
      orders.value = orders.value.filter((order) => !orderIds.includes(order.id));
      orderIds.forEach((orderId) => selectedOrderIds.value.delete(orderId));
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Khong the xoa nhieu don hang.";
      return false;
    }
  }

  async function importOrderBatch(payloads: OrderPayload[]) {
    saving.value = true;
    error.value = null;

    try {
      const created = await importOrders(payloads);
      orders.value = [...created, ...orders.value].sort((left, right) => right.date.localeCompare(left.date));
      return created.length;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Khong the import don hang.";
      return 0;
    } finally {
      saving.value = false;
    }
  }

  function toggleSelect(id: string) {
    if (selectedOrderIds.value.has(id)) {
      selectedOrderIds.value.delete(id);
      return;
    }

    selectedOrderIds.value.add(id);
  }

  function toggleSelectAll() {
    if (isAllSelected.value) {
      filteredOrders.value.forEach((order) => selectedOrderIds.value.delete(order.id));
      return;
    }

    filteredOrders.value.forEach((order) => selectedOrderIds.value.add(order.id));
  }

  function clearSelection() {
    selectedOrderIds.value.clear();
  }

  return {
    orders,
    loading,
    saving,
    error,
    filterDates,
    filteredOrders,
    selectedOrderIds,
    isAllSelected,
    isSomeSelected,
    loadOrders,
    addOrder,
    updateOrderData,
    deleteOrderData,
    deleteMultipleOrders,
    importOrderBatch,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
  };
}

