<script setup lang="ts">
import { computed, onMounted } from "vue";

import { useOrders } from "@/composables/useOrders";
import { useAuthStore } from "@/stores/auth";
import { useCsvImportExport } from "@/composables/useCsvImportExport";

const auth = useAuthStore();
const { orders, loadOrders, loading } = useOrders();
const { formatMoney } = useCsvImportExport();

const totalFinal = computed(() =>
  orders.value.reduce((sum, order) => sum + order.users.reduce((userSum, user) => userSum + user.final, 0), 0),
);

const totalDiscount = computed(() =>
  orders.value.reduce((sum, order) => sum + order.users.reduce((userSum, user) => userSum + user.discount, 0), 0),
);

onMounted(async () => {
  await auth.init();
  await loadOrders();
});
</script>

<template>
  <section class="user-dashboard">
    <article class="card user-dashboard__hero">
      <div class="card__body">
        <p class="user-dashboard__eyebrow">Người dùng</p>
        <h1 class="user-dashboard__title">Tổng quan quản lý orders chung cho người dùng</h1>
        <p class="muted user-dashboard__copy">
          Bạn có thể xem thống kê orders, tổng chi và mức giảm, nhưng không thể tạo hay chỉnh sửa dữ liệu.
        </p>
      </div>
    </article>

    <div class="user-dashboard__stats">
      <article class="card">
        <div class="card__body">
          <p class="user-dashboard__stat-label">Tổng orders</p>
          <strong class="user-dashboard__stat-value">{{ loading ? "..." : orders.length }}</strong>
        </div>
      </article>
      <article class="card">
        <div class="card__body">
          <p class="user-dashboard__stat-label">Đã thanh toán</p>
          <strong class="user-dashboard__stat-value">{{ loading ? "..." : formatMoney(totalFinal) }}</strong>
        </div>
      </article>
      <article class="card">
        <div class="card__body">
          <p class="user-dashboard__stat-label">Tiết kiệm</p>
          <strong class="user-dashboard__stat-value">{{ loading ? "..." : formatMoney(totalDiscount) }}</strong>
        </div>
      </article>
    </div>

    <article class="card">
      <div class="card__body">
        <h2 class="user-dashboard__section-title">Khu vực truy cập</h2>
        <p class="muted user-dashboard__copy">
          Để xem danh sách và thống kê chi tiết, vào trang quản lý orders dành cho người dùng.
        </p>
        <RouterLink class="btn btn--primary" to="/user/orders">Mở trang xem orders</RouterLink>
      </div>
    </article>
  </section>
</template>

<style scoped>
.user-dashboard,
.user-dashboard__stats {
  display: grid;
  gap: 22px;
}

.user-dashboard__stats {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.user-dashboard__eyebrow,
.user-dashboard__stat-label {
  margin: 0 0 10px;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 11px;
  font-weight: 700;
}

.user-dashboard__title {
  margin: 0 0 12px;
  font-size: clamp(32px, 5vw, 48px);
}

.user-dashboard__copy {
  margin: 0 0 18px;
}

.user-dashboard__stat-value {
  font-size: 32px;
  font-family: "IBM Plex Mono", monospace;
}

.user-dashboard__section-title {
  margin: 0 0 10px;
  font-size: 24px;
}

@media (max-width: 900px) {
  .user-dashboard__stats {
    grid-template-columns: 1fr;
  }
}
</style>
