<script setup lang="ts">
import { computed } from "vue";

import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const email = computed(() => auth.user?.email ?? null);
const roleLabel = computed(() => {
  switch (auth.role) {
    case "master_admin":
      return "Master admin";
    case "admin":
      return "Admin";
    case "user":
      return "Người dùng";
    default:
      return null;
  }
});
</script>

<template>
  <section class="home-layout">
    <article class="card home-hero">
      <div class="card__body home-hero__body">
        <p class="home-hero__eyebrow">Quan ly orders</p>
        <h1 class="home-card__title">Một khu quản lý orders chung cho người dùng, đồng bộ dữ liệu qua Supabase.</h1>
        <p class="muted home-card__copy">
          Giao diện được tối ưu cho login, quản lý orders, import CSV và theo dõi dữ liệu trong một luồng thao tác liền mạch.
        </p>

        <p v-if="email" class="home-pill">Đang đăng nhập với {{ email }}<span v-if="roleLabel"> · {{ roleLabel }}</span></p>

        <div class="row home-card__actions">
          <RouterLink
            class="btn btn--primary home-card__link"
            :to="email ? (auth.isAdmin ? '/admin/dashboard' : '/user/dashboard') : '/login'"
          >
            {{ email ? "Mở tổng quan" : "Đăng nhập để quản lý" }}
          </RouterLink>
          <RouterLink
            class="btn home-card__link"
            :to="email ? (auth.isAdmin ? '/admin/orders' : '/user/orders') : '/orders'"
          >
            Xem orders ngay
          </RouterLink>
        </div>
      </div>
    </article>

    <div class="home-grid">
      <article class="card feature-card">
        <div class="card__body">
          <p class="feature-card__kicker">Auth</p>
          <h2>Email/password flow</h2>
          <p class="muted">Đăng nhập nhanh với Supabase Auth và header tự đổi trạng thái theo session.</p>
        </div>
      </article>

      <article class="card feature-card">
        <div class="card__body">
          <p class="feature-card__kicker">Orders</p>
          <h2>Quản lý orders chung</h2>
          <p class="muted">Ai cũng có thể xem danh sách và thống kê; đăng nhập admin để CRUD và import dữ liệu.</p>
        </div>
      </article>

      <article class="card feature-card feature-card--accent">
        <div class="card__body">
          <p class="feature-card__kicker">Deploy</p>
          <h2>Vercel ready</h2>
          <p class="muted">Analytics, Speed Insights, router rewrite và Supabase env đã có sẵn cho flow deploy.</p>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.home-layout {
  display: grid;
  gap: 22px;
}

.home-hero {
  overflow: hidden;
}

.home-hero__body {
  padding: 34px;
  position: relative;
}

.home-hero__body::after {
  content: "";
  position: absolute;
  width: 220px;
  height: 220px;
  right: -30px;
  top: -40px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(244, 197, 139, 0.34), transparent 68%);
  pointer-events: none;
}

.home-hero__eyebrow {
  margin: 0 0 10px;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 11px;
  font-weight: 700;
}

.home-card__title {
  margin: 0 0 14px;
  font-size: clamp(34px, 5vw, 56px);
  max-width: 12ch;
}

.home-card__copy {
  margin: 0 0 20px;
  max-width: 58ch;
  font-size: 16px;
}

.home-card__actions {
  margin-top: 12px;
}

.home-card__link {
  text-decoration: none;
  text-align: center;
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.feature-card {
  min-height: 210px;
}

.feature-card--accent {
  background:
    linear-gradient(135deg, rgba(123, 224, 195, 0.12), rgba(244, 197, 139, 0.12)),
    var(--surface);
}

.feature-card__kicker {
  margin: 0 0 12px;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 11px;
  font-weight: 700;
}

.feature-card h2 {
  margin: 0 0 12px;
  font-size: 24px;
}

.feature-card p:last-child {
  margin-bottom: 0;
}

.home-pill {
  display: inline-flex;
  border: 1px solid rgba(123, 224, 195, 0.22);
  background: rgba(123, 224, 195, 0.08);
  color: var(--accent);
  padding: 9px 14px;
  border-radius: 999px;
  font-size: 13px;
  margin: 0 0 10px;
}

@media (max-width: 960px) {
  .home-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .home-hero__body {
    padding: 24px;
  }

  .home-card__actions {
    flex-direction: column;
  }

  .home-card__title {
    max-width: none;
    font-size: clamp(30px, 10vw, 44px);
  }

  .home-grid {
    grid-template-columns: 1fr;
  }

  .home-card__link {
    width: 100%;
    text-align: center;
  }
}
</style>
