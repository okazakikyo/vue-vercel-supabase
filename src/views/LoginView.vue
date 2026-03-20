<script setup lang="ts">
import { ref } from "vue";
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
</script>

<template>
  <section class="login-shell">
    <article class="card login-card login-card--intro">
      <div class="card__body login-card__body">
        <p class="login-card__eyebrow">Access control</p>
        <h1 class="login-card__title">Đăng nhập để mở dashboard và đồng bộ orders với Supabase.</h1>
        <p class="muted login-card__copy">
          Flow này dùng email/password cơ bản, phù hợp để bạn bootstrap project trước rồi mở rộng OAuth sau.
        </p>
        <div class="login-stat-list">
          <div>
            <strong>Auth</strong>
            <span>Supabase session</span>
          </div>
          <div>
            <strong>Data</strong>
            <span>Orders + CSV import</span>
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
        <h2 class="login-form__title">{{ mode === "signup" ? "Tạo tài khoản mới" : "Đăng nhập workspace" }}</h2>
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
  gap: 18px;
}

.login-card__body {
  padding: 28px;
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
  margin: 0 0 10px;
  font-size: clamp(34px, 4.8vw, 50px);
  line-height: 1;
}

.login-card__copy {
  margin: 0 0 16px;
}

.login-form__title {
  margin: 0 0 8px;
  font-size: 28px;
}

.login-card__label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.login-card__message {
  margin: 0 0 12px;
  color: var(--muted);
}

.login-card__message--error {
  color: var(--danger);
}

.login-stat-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 26px;
}

.login-stat-list div {
  padding: 14px;
  border-radius: 18px;
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
}

@media (max-width: 720px) {
  .login-shell {
    grid-template-columns: 1fr;
  }

  .login-card__body {
    padding: 20px;
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
