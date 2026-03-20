<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";

import AnalyticsPanel from "@/components/AnalyticsPanel.vue";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const auth = useAuthStore();

const email = computed(() => auth.user?.email ?? null);

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
        <p class="dashboard-card__eyebrow">Signed in workspace</p>
        <div class="dashboard-card__row">
          <div>
            <h1 class="dashboard-card__title">Dashboard</h1>
            <p class="muted dashboard-card__copy">Một overview ngắn trước khi đi vào analytics và quản lý orders.</p>
          </div>
          <div class="dashboard-card__chip">{{ email || "No active session" }}</div>
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
            <strong>Ready</strong>
          </div>
        </div>

        <button class="btn btn--danger dashboard-card__logout" type="button" @click="signOut">Sign out</button>
      </div>
    </article>

    <AnalyticsPanel />
  </section>
</template>

<style scoped>
.dashboard-shell {
  display: grid;
  gap: 18px;
}

.dashboard-card__body {
  padding: 28px;
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
  margin: 0 0 16px;
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 14px 0 24px;
}

.dashboard-card__stats div {
  padding: 16px;
  border-radius: 18px;
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

@media (max-width: 720px) {
  .dashboard-card__body {
    padding: 20px;
  }

  .dashboard-card__stats {
    grid-template-columns: 1fr;
  }

  .dashboard-card__logout {
    width: 100%;
  }
}
</style>
