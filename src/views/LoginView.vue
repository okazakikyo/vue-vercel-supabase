<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const email = ref("");
const password = ref("");
const loading = ref(false);
const errorText = ref<string | null>(null);
const infoText = ref<string | null>(null);
const mode = ref<"signin" | "signup">("signin");

async function redirectIfAuthenticated() {
  await auth.init();
  if (auth.session) {
    await router.replace(auth.isAdmin ? { name: "admin-dashboard" } : { name: "user-dashboard" });
  }
}

async function submit() {
  errorText.value = null;
  infoText.value = null;
  loading.value = true;
  try {
    if (mode.value === "signup") {
      await auth.signUp(email.value, password.value);
      if (!auth.session) {
        infoText.value = "Tài khoản đã tạo. Vui lòng kiểm tra email để xác nhận trước khi đăng nhập.";
        return;
      }
    } else {
      await auth.signInWithPassword(email.value, password.value);
    }

    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/dashboard";
    await router.replace(redirect);
  } catch (e) {
    errorText.value = e instanceof Error ? e.message : "Unknown error";
  } finally {
    loading.value = false;
  }
}

watch(
  () => auth.session,
  async (session) => {
    if (session) {
      await router.replace(auth.isAdmin ? { name: "admin-dashboard" } : { name: "user-dashboard" });
    }
  },
);

onMounted(async () => {
  await redirectIfAuthenticated();
});
</script>

<template>
  <section class="login-shell">
    <article class="card login-card login-card--intro">
      <div class="card__body login-card__body">
        <p class="login-card__eyebrow">Access control</p>
        <h1 class="login-card__title">Đăng nhập để vào khu quản lý orders chung cho người dùng.</h1>
        <p class="muted login-card__copy">
          Flow này dùng email/password cơ bản, phù hợp để khởi tạo nhanh hệ thống quản lý orders chung cho người dùng.
        </p>
        <div class="login-stat-list">
          <div>
            <strong>Auth</strong>
            <span>Supabase session</span>
          </div>
          <div>
            <strong>Orders</strong>
            <span>Quản lý chung + CSV import</span>
          </div>
          <div>
            <strong>Deploy</strong>
            <span>Vercel ready</span>
          </div>
        </div>
      </div>
    </article>

    <article class="card login-card login-card--form">
      <div class="card__body login-card__body">
        <p class="login-card__eyebrow">{{ mode === "signup" ? "Create account" : "Welcome back" }}</p>
        <h2 class="login-form__title">{{ mode === "signup" ? "Tạo tài khoản mới" : "Đăng nhập quản lý orders" }}</h2>
        <p class="muted login-card__copy">Dùng Supabase Auth (email/password).</p>

        <form @submit.prevent="submit">
          <label class="muted login-card__label" for="email">Email</label>
          <div class="spacer"></div>
          <input id="email" v-model="email" class="input" autocomplete="email" inputmode="email" required />

          <div class="spacer"></div>
          <label class="muted login-card__label" for="password">Password</label>
          <div class="spacer"></div>
          <input id="password" v-model="password" class="input" type="password" autocomplete="current-password" required />

          <div class="spacer"></div>
          <p v-if="errorText" class="login-card__message login-card__message--error">{{ errorText }}</p>
          <p v-else-if="infoText" class="login-card__message">{{ infoText }}</p>

          <div class="row login-card__actions">
            <button class="btn btn--primary" type="submit" :disabled="loading">
              {{ loading ? "Đang xử lý..." : mode === "signup" ? "Sign up" : "Sign in" }}
            </button>

            <button
              class="btn"
              type="button"
              :disabled="loading"
              @click="mode = mode === 'signup' ? 'signin' : 'signup'"
            >
              Chuyển sang {{ mode === "signup" ? "Sign in" : "Sign up" }}
            </button>
          </div>
        </form>
      </div>
    </article>
  </section>
</template>

<style scoped>
.login-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 22px;
  align-items: stretch;
}

.login-card__body {
  padding: 32px;
}

.login-card__eyebrow {
  margin: 0 0 12px;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 11px;
  font-weight: 700;
}

.login-card__title {
  margin: 0 0 14px;
  font-size: clamp(34px, 4.8vw, 50px);
}

.login-card__copy {
  margin: 0 0 18px;
}

.login-form__title {
  margin: 0 0 10px;
  font-size: 30px;
}

.login-card__label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.login-card__message {
  margin: 0 0 14px;
  color: var(--muted);
}

.login-card__message--error {
  color: var(--danger);
}

.login-stat-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 28px;
}

.login-stat-list div {
  padding: 16px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.03);
}

.login-stat-list strong,
.login-stat-list span {
  display: block;
}

.login-stat-list strong {
  margin-bottom: 4px;
}

.login-stat-list span {
  color: var(--muted);
  font-size: 13px;
}

.login-card__actions {
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

form {
  display: grid;
  gap: 6px;
}

@media (max-width: 960px) {
  .login-shell {
    grid-template-columns: 1fr;
  }

  .login-card__body {
    padding: 26px;
  }
}

@media (max-width: 720px) {
  .login-card__body {
    padding: 22px;
  }

  .login-stat-list {
    grid-template-columns: 1fr;
  }

  .login-card__actions {
    flex-direction: column;
  }

  .login-card__actions .btn {
    width: 100%;
  }
}
</style>
