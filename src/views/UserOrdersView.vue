<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { useCsvImportExport } from "@/composables/useCsvImportExport";
import { useOrders } from "@/composables/useOrders";

const { filteredOrders, filterDates, loading, error, loadOrders } = useOrders();
const { formatDate, formatMoney, formatMonthKey } = useCsvImportExport();
const selectedMonth = ref("");

const monthly = computed(() => {
  const map: Record<string, { total_final: number; total_discount: number; count: number }> = {};

  filteredOrders.value.forEach((order) => {
    const key = order.date.slice(0, 7);
    if (!map[key]) {
      map[key] = { total_final: 0, total_discount: 0, count: 0 };
    }

    const bucket = map[key]!;
    bucket.count += 1;
    order.users.forEach((user) => {
      bucket.total_final += user.final;
      bucket.total_discount += user.discount;
    });
  });

  return Object.entries(map)
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([month, value]) => ({ month, ...value }));
});

const visibleMonthly = computed(() =>
  selectedMonth.value ? monthly.value.filter((entry) => entry.month === selectedMonth.value) : monthly.value,
);

onMounted(() => {
  loadOrders();
});
</script>

<template>
  <section class="user-orders-page">
    <article class="card user-orders-hero">
      <div class="card__body">
        <p class="user-orders-hero__eyebrow">Người dùng</p>
        <h1 class="user-orders-hero__title">Theo dõi orders và thống kê chung</h1>
        <p class="muted user-orders-hero__copy">
          Khách chưa đăng nhập vẫn có thể xem dữ liệu orders và thống kê. Chỉ admin mới có quyền CRUD.
        </p>
      </div>
    </article>

    <article class="card user-orders-panel">
      <div class="card__body">
        <div class="user-orders-toolbar">
          <div>
            <h2 class="user-orders-toolbar__title">Bộ lọc</h2>
            <p class="muted user-orders-toolbar__copy">Lọc danh sách orders theo khoảng ngày để xem tổng hợp nhanh.</p>
          </div>
          <div class="user-orders-toolbar__controls">
            <label class="user-orders-field">
              <span>Từ ngày</span>
              <input v-model="filterDates.from" class="input" type="date" />
            </label>
            <label class="user-orders-field">
              <span>Đến ngày</span>
              <input v-model="filterDates.to" class="input" type="date" />
            </label>
            <button class="btn btn--primary" type="button" @click="loadOrders">Làm mới</button>
          </div>
        </div>
      </div>
    </article>

    <div class="user-orders-grid">
      <article class="card user-orders-panel">
        <div class="card__body">
          <div class="user-orders-section-head">
            <div>
              <h2 class="user-orders-toolbar__title">Danh sách orders</h2>
              <p class="muted user-orders-toolbar__copy">{{ filteredOrders.length }} orders hiển thị.</p>
            </div>
          </div>

          <div v-if="loading" class="user-orders-empty">Đang tải dữ liệu...</div>
          <div v-else-if="filteredOrders.length === 0" class="user-orders-empty">Chưa có orders trong phạm vi lọc.</div>
          <div v-else class="user-orders-list">
            <article v-for="order in filteredOrders" :key="order.id" class="user-order-card">
              <div class="user-order-card__head">
                <div>
                  <h3>{{ order.shop }}</h3>
                  <p>{{ formatDate(order.date) }}</p>
                </div>
                <div class="user-order-card__totals">
                  <span>{{ formatMoney(order.total_before) }}</span>
                  <strong>{{ formatMoney(order.total_after) }}</strong>
                </div>
              </div>

              <div class="user-order-card__users">
                <div v-for="user in order.users" :key="`${order.id}-${user.name}`" class="user-order-card__user">
                  <span>{{ user.name }}</span>
                  <strong>{{ formatMoney(user.final) }}</strong>
                </div>
              </div>
            </article>
          </div>
        </div>
      </article>

      <article class="card user-orders-panel">
        <div class="card__body">
          <div class="user-orders-section-head">
            <div>
              <h2 class="user-orders-toolbar__title">Thống kê theo tháng</h2>
              <p class="muted user-orders-toolbar__copy">Tổng hợp số order, đã thanh toán và mức giảm trong từng tháng.</p>
            </div>
            <select v-model="selectedMonth" class="input user-orders-select">
              <option value="">Tất cả tháng</option>
              <option v-for="entry in monthly" :key="entry.month" :value="entry.month">{{ formatMonthKey(entry.month) }}</option>
            </select>
          </div>

          <div v-if="visibleMonthly.length === 0" class="user-orders-empty">Chưa có thống kê khả dụng.</div>
          <div v-else class="user-orders-summary">
            <article v-for="entry in visibleMonthly" :key="entry.month" class="user-summary-card">
              <p class="user-summary-card__month">{{ formatMonthKey(entry.month) }}</p>
              <div class="user-summary-card__stats">
                <div>
                  <span>Số orders</span>
                  <strong>{{ entry.count }}</strong>
                </div>
                <div>
                  <span>Đã thanh toán</span>
                  <strong>{{ formatMoney(entry.total_final) }}</strong>
                </div>
                <div>
                  <span>Tiết kiệm</span>
                  <strong>{{ formatMoney(entry.total_discount) }}</strong>
                </div>
              </div>
            </article>
          </div>
        </div>
      </article>
    </div>

    <p v-if="error" class="user-orders-error">{{ error }}</p>
  </section>
</template>

<style scoped>
.user-orders-page,
.user-orders-grid,
.user-orders-list,
.user-orders-summary {
  display: grid;
  gap: 22px;
}

.user-orders-grid {
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
}

.user-orders-hero__eyebrow,
.user-summary-card__month {
  margin: 0 0 10px;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 11px;
  font-weight: 700;
}

.user-orders-hero__title {
  margin: 0 0 12px;
  font-size: clamp(32px, 5vw, 48px);
}

.user-orders-hero__copy,
.user-orders-toolbar__copy {
  margin: 0;
}

.user-orders-toolbar,
.user-orders-toolbar__controls,
.user-orders-section-head,
.user-order-card__head,
.user-order-card__totals {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.user-orders-toolbar__title {
  margin: 0 0 8px;
  font-size: 22px;
}

.user-orders-toolbar__controls {
  align-items: flex-end;
}

.user-orders-field {
  min-width: 150px;
}

.user-orders-field span,
.user-summary-card__stats span {
  display: block;
  margin-bottom: 6px;
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.user-order-card,
.user-summary-card {
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
}

.user-order-card h3 {
  margin: 0 0 4px;
}

.user-order-card p {
  margin: 0;
  color: var(--muted);
}

.user-order-card__totals {
  gap: 10px;
}

.user-order-card__totals span,
.user-order-card__totals strong,
.user-summary-card__stats strong {
  font-family: "IBM Plex Mono", monospace;
}

.user-order-card__users {
  margin-top: 18px;
  display: grid;
  gap: 12px;
}

.user-order-card__user {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

.user-summary-card__stats {
  display: grid;
  gap: 14px;
}

.user-orders-empty,
.user-orders-error {
  padding: 22px;
  border-radius: 18px;
  text-align: center;
}

.user-orders-empty {
  color: var(--muted);
  border: 1px dashed var(--border);
}

.user-orders-error {
  color: var(--danger);
  border: 1px solid rgba(255, 127, 114, 0.24);
  background: rgba(255, 127, 114, 0.08);
}

@media (max-width: 900px) {
  .user-orders-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .user-orders-panel .card__body {
    padding: 20px;
  }

  .user-orders-toolbar__controls {
    width: 100%;
  }

  .user-orders-field,
  .user-orders-toolbar__controls .btn,
  .user-orders-select {
    width: 100%;
  }
}
</style>
