<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import GoogleAdBar from "@/components/GoogleAdBar.vue";
import { isAdsEnabled, isAutoAdsEnabled, loadAdSenseScript } from "@/lib/adsense";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const auth = useAuthStore();
const navOpen = ref(false);
const loggingOut = ref(false);

const isAuthenticated = computed(() => Boolean(auth.session));
const isAdmin = computed(() => auth.isAdmin);
const isMasterAdmin = computed(() => auth.isMasterAdmin);

onMounted(async () => {
  await auth.init();

  const client = import.meta.env.VITE_ADSENSE_CLIENT?.trim();
  if (isAdsEnabled() && client && isAutoAdsEnabled()) {
    await loadAdSenseScript(client);
  }
});

async function handleAuthAction() {
  if (!isAuthenticated.value) {
    navOpen.value = false;
    await router.push({ name: "login" });
    return;
  }

  loggingOut.value = true;
  try {
    await auth.signOut();
    navOpen.value = false;
    await router.push({ name: "login" });
  } finally {
    loggingOut.value = false;
  }
}

function closeNav() {
  navOpen.value = false;
}
</script>
<template>
  <header class="header">
    <div class="container header__inner">
      <RouterLink class="brand" to="/" @click="closeNav">
        <span class="brand__mark">VS</span>
        <span>
          <strong>Quản lý orders</strong>
          <small>Cho người dùng</small>
        </span>
      </RouterLink>

      <button class="nav-toggle" type="button" :aria-expanded="navOpen" @click="navOpen = !navOpen">
        {{ navOpen ? "Đóng" : "Menu" }}
      </button>

      <nav class="nav" :class="{ 'nav--open': navOpen }">
        <RouterLink class="nav__link" to="/" @click="closeNav">Home</RouterLink>
        <RouterLink
          v-if="isAuthenticated"
          class="nav__link"
          :to="isAdmin ? '/admin/dashboard' : '/user/dashboard'"
          @click="closeNav"
        >
          Tổng quan
        </RouterLink>
        <RouterLink
          class="nav__link"
          :to="isAuthenticated ? (isAdmin ? '/admin/orders' : '/user/orders') : '/orders'"
          @click="closeNav"
        >
          Orders
        </RouterLink>
        <RouterLink
          v-if="isMasterAdmin"
          class="nav__link"
          to="/admin/accounts"
          @click="closeNav"
        >
          Admin accounts
        </RouterLink>
        <button class="nav__action" type="button" :disabled="loggingOut" @click="handleAuthAction">
          {{ loggingOut ? "..." : isAuthenticated ? "Đăng xuất" : "Đăng nhập" }}
        </button>
      </nav>
    </div>
  </header>
  <main class="container main">
    <RouterView />
  </main>
  <GoogleAdBar />
</template>
<style scoped>
.header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  background: rgba(7, 19, 26, 0.72);
  position: sticky;
  top: 0;
  z-index: 30;
  backdrop-filter: blur(18px);
}
.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 0 16px;
  gap: 18px;
  position: relative;
}
.brand {
  text-decoration: none;
  color: var(--text);
  display: inline-flex;
  gap: 14px;
  align-items: center;
  min-width: 0;
}
.brand strong {
  display: block;
  font-size: 15px;
}
.brand small {
  display: block;
  margin-top: 2px;
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.brand__mark {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #08151a;
  background: linear-gradient(135deg, var(--accent), var(--accent-warm));
  box-shadow: 0 18px 36px rgba(123, 224, 195, 0.18);
}
.nav {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  flex-wrap: wrap;
  justify-content: flex-end;
}
.nav__link {
  color: var(--muted);
  text-decoration: none;
  font-weight: 600;
  padding: 10px 14px;
  border-radius: 999px;
  transition: background 0.18s ease, color 0.18s ease;
}
.nav__link.router-link-active {
  color: var(--text);
  background: rgba(123, 224, 195, 0.12);
}
.nav__action {
  appearance: none;
  border: 1px solid rgba(123, 224, 195, 0.18);
  background: rgba(123, 224, 195, 0.12);
  color: var(--accent);
  border-radius: 999px;
  padding: 10px 16px;
  font-weight: 700;
  cursor: pointer;
}
.nav-toggle {
  display: none;
  appearance: none;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
}
.main {
  padding: 34px 0 56px;
}

@media (max-width: 720px) {
  .header__inner {
    padding: 14px 0;
  }

  .nav-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
    min-width: 92px;
  }

  .nav {
    display: none;
    position: absolute;
    top: calc(100% + 10px);
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 12px;
    border-radius: 22px;
    background: var(--surface-elevated);
    box-shadow: 0 22px 46px rgba(2, 10, 14, 0.28);
  }

  .nav--open {
    display: flex;
  }

  .nav__link,
  .nav__action {
    width: 100%;
    text-align: center;
    justify-content: center;
    border-radius: 16px;
  }

  .brand strong {
    font-size: 14px;
  }

  .brand small {
    letter-spacing: 0.1em;
  }

  .main {
    padding-top: 22px;
  }
}
</style>
