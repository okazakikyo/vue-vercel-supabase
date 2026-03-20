<script setup lang="ts">
import { computed } from "vue";

import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const email = computed(() => auth.user?.email ?? null);
</script>

<template>
  <section class="home-layout">
    <article class="card home-hero">
      <div class="card__body home-hero__body">
        <p class="home-hero__eyebrow">Realtime workspace</p>
        <h1 class="home-card__title">Một workspace gọn để login, quản lý orders và đẩy data qua Supabase.</h1>
        <p class="muted home-card__copy">
          UI được dựng lại theo hướng glass dashboard để nhìn hiện đại hơn nhưng vẫn giữ flow nhanh cho thao tác hằng ngày.
        </p>

        <p v-if="email" class="home-pill">Đang đăng nhập với {{ email }}</p>

        <div class="row home-card__actions">
          <RouterLink class="btn btn--primary home-card__link" to="/dashboard">Mở Dashboard</RouterLink>
          <RouterLink class="btn home-card__link" to="/orders">Đi tới Orders</RouterLink>
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
          <h2>CRUD + CSV + summary</h2>
          <p class="muted">Import file, chỉnh sửa đơn, bulk delete và tổng hợp theo tháng trong cùng một module.</p>
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
  gap: 18px;
}

.home-hero {
  overflow: hidden;
}

.home-card__body {
  padding: 30px;
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
  margin: 0 0 12px;
  font-size: clamp(34px, 5vw, 56px);
  line-height: 0.98;
  max-width: 11ch;
}

.home-card__copy {
  margin: 0 0 18px;
  max-width: 54ch;
  font-size: 16px;
}

.home-card__actions {
  margin-top: 10px;
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
  min-height: 190px;
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
  margin: 0 0 10px;
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
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 13px;
  margin: 0 0 10px;
}

@media (max-width: 720px) {
  .home-card__body {
    padding: 20px;
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
