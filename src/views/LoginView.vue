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
  <section class="card" style="max-width: 520px; margin: 0 auto">
    <div class="card__body">
      <h1 style="margin: 0 0 6px">Login</h1>
      <p class="muted" style="margin: 0 0 14px">Dùng Supabase Auth (email/password).</p>

      <form @submit.prevent="submit">
        <label class="muted" for="email">Email</label>
        <div class="spacer"></div>
        <input id="email" v-model="email" class="input" autocomplete="email" inputmode="email" required />

        <div class="spacer"></div>
        <label class="muted" for="password">Password</label>
        <div class="spacer"></div>
        <input id="password" v-model="password" class="input" type="password" autocomplete="current-password" required />

        <div class="spacer"></div>
        <p v-if="errorText" style="margin: 0 0 12px; color: var(--danger)">{{ errorText }}</p>
        <p v-else-if="infoText" style="margin: 0 0 12px; color: var(--muted)">{{ infoText }}</p>

        <div class="row" style="justify-content: space-between; align-items: center">
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
  </section>
</template>
