<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";

import AnalyticsPanel from "@/components/AnalyticsPanel.vue";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const auth = useAuthStore();

const email = computed(() => auth.user?.email ?? null);
const roleText = computed(() => {
  if (auth.isMasterAdmin) return "Master admin";
  if (auth.isAdmin) return "Admin";
  return "Người dùng";
});

onMounted(async () => {
  await auth.init();
});

async function signOut() {
  await auth.signOut();
  await router.replace({ name: "login" });
}
</script>

<template>
  <section class="dashboard-shell">
    <article class="card dashboard-hero">
      <div class="card__body dashboard-card__body">
        <p class="dashboard-card__eyebrow">Quan ly orders</p>
        <div class="dashboard-card__row">
          <div>
            <h1 class="dashboard-card__title">Tổng quan hệ thống</h1>
            <p class="muted dashboard-card__copy">Một overview ngắn cho khu vực quản trị orders, analytics và quyền hệ thống.</p>
          </div>
          <div class="dashboard-card__chip">{{ roleText }} · {{ email || "No active session" }}</div>
        </div>

        <div class="dashboard-card__stats">
          <div>
            <span>Session</span>
            <strong>Active</strong>
          </div>
          <div>
            <span>Analytics</span>
            <strong>Connected</strong>
          </div>
          <div>
            <span>Orders</span>
            <strong>Shared</strong>
          </div>
          <div v-if="auth.isMasterAdmin">
            <span>Admin accounts</span>
            <strong>Manageable</strong>
          </div>
        </div>

        <button class="btn btn--danger dashboard-card__logout" type="button" @click="signOut">Sign out</button>
      </div>
    </article>

    <div class="dashboard-card__quick-grid">
      <article class="card">
        <div class="card__body dashboard-card__mini">
          <span>Điều phối</span>
          <strong>Admin có thể CRUD toàn bộ orders</strong>
          <p class="muted">Tạo, sửa, xoá và import dữ liệu dùng chung cho toàn hệ thống.</p>
        </div>
      </article>
      <article class="card">
        <div class="card__body dashboard-card__mini">
          <span>Truy cập</span>
          <strong>User chỉ xem dashboard và thống kê</strong>
          <p class="muted">Quyền xem được tách riêng để dữ liệu an toàn và dễ kiểm soát hơn.</p>
        </div>
      </article>
    </div>

    <AnalyticsPanel />
  </section>
</template>

<style scoped>
.dashboard-shell {
  display: grid;
  gap: 22px;
}

.dashboard-card__body {
  padding: 32px;
}

.dashboard-card__eyebrow {
  margin: 0 0 12px;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 11px;
  font-weight: 700;
}

.dashboard-card__row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.dashboard-card__title {
  margin: 0 0 8px;
  font-size: clamp(34px, 4vw, 46px);
}

.dashboard-card__copy {
  margin: 0 0 18px;
}

.dashboard-card__chip {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(123, 224, 195, 0.1);
  border: 1px solid rgba(123, 224, 195, 0.22);
  color: var(--accent);
  font-size: 13px;
  max-width: 100%;
  overflow-wrap: anywhere;
}

.dashboard-card__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin: 18px 0 24px;
}

.dashboard-card__stats div {
  padding: 18px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.03);
}

.dashboard-card__stats span,
.dashboard-card__stats strong {
  display: block;
}

.dashboard-card__stats span {
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
}

.dashboard-card__quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.dashboard-card__mini {
  display: grid;
  gap: 10px;
}

.dashboard-card__mini span {
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.dashboard-card__mini strong,
.dashboard-card__mini p {
  margin: 0;
}

@media (max-width: 960px) {
  .dashboard-card__stats,
  .dashboard-card__quick-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .dashboard-card__body {
    padding: 22px;
  }

  .dashboard-card__stats,
  .dashboard-card__quick-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-card__logout {
    width: 100%;
  }
}
</style>
