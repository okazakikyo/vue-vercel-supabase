<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";

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
  <section class="card">
    <div class="card__body">
      <h1 style="margin: 0 0 6px">Dashboard</h1>
      <p class="muted" style="margin: 0 0 14px">Trang này yêu cầu đăng nhập.</p>

      <p v-if="email" style="margin: 0 0 14px">Xin chào, <b>{{ email }}</b></p>

      <button class="btn btn--danger" type="button" @click="signOut">Sign out</button>
    </div>
  </section>
</template>

