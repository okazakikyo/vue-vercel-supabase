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
          <strong>Vue Supabase</strong>
          <small>Orders cockpit</small>
        </span>
      </RouterLink>

      <button class="nav-toggle" type="button" :aria-expanded="navOpen" @click="navOpen = !navOpen">
        Menu
      </button>

      <nav class="nav" :class="{ 'nav--open': navOpen }">
        <RouterLink class="nav__link" to="/" @click="closeNav">Home</RouterLink>
        <RouterLink class="nav__link" to="/dashboard" @click="closeNav">Dashboard</RouterLink>
        <RouterLink class="nav__link" to="/orders" @click="closeNav">Orders</RouterLink>
        <button class="nav__action" type="button" :disabled="loggingOut" @click="handleAuthAction">
          {{ loggingOut ? "..." : isAuthenticated ? "Logout" : "Login" }}
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
  z-index: 10;
  backdrop-filter: blur(16px);
}
.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 0;
  gap: 16px;
  position: relative;
}
.brand {
  text-decoration: none;
  color: var(--text);
  white-space: nowrap;
  display: inline-flex;
  gap: 12px;
  align-items: center;
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
  width: 44px;
  height: 44px;
  border-radius: 14px;
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
  gap: 10px;
  align-items: center;
  padding: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
.nav__link {
  color: var(--muted);
  text-decoration: none;
  font-weight: 600;
  padding: 10px 14px;
  border-radius: 999px;
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
  padding: 32px 0 44px;
}

@media (max-width: 720px) {
  .header__inner {
    flex-wrap: wrap;
  }

  .nav-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
  }

  .nav {
    display: none;
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 12px;
    border-radius: 20px;
  }

  .nav--open {
    display: flex;
  }

  .nav__link,
  .nav__action {
    width: 100%;
    text-align: center;
    justify-content: center;
    border-radius: 14px;
  }
}
</style>
