<script setup lang="ts">
import { computed } from "vue";

import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const email = computed(() => auth.user?.email ?? null);
</script>

<template>
  <section class="card">
    <div class="card__body">
      <h1 style="margin: 0 0 6px">Template Vue 3 + Supabase</h1>
      <p class="muted" style="margin: 0 0 14px">
        Skeleton có sẵn Router + Pinia + Auth flow cơ bản (email/password).
      </p>

      <p v-if="email" class="muted" style="margin: 0 0 14px">Đang đăng nhập: <b>{{ email }}</b></p>

      <div class="row">
        <RouterLink class="btn btn--primary" to="/dashboard" style="text-decoration: none">Đi tới Dashboard</RouterLink>
        <RouterLink class="btn" to="/login" style="text-decoration: none">Tới trang Login</RouterLink>
      </div>
    </div>
  </section>
</template>

