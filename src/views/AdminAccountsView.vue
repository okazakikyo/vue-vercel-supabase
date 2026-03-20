<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";

import { createAdminAccount, fetchProfiles, type ProfileRecord } from "@/lib/profileService";

const profiles = ref<ProfileRecord[]>([]);
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);

const form = reactive({
  email: "",
  password: "",
  fullName: "",
  username: "",
});

async function loadProfiles() {
  loading.value = true;
  error.value = null;
  try {
    profiles.value = await fetchProfiles();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Khong the tai danh sach tai khoan.";
  } finally {
    loading.value = false;
  }
}

async function submit() {
  saving.value = true;
  error.value = null;
  success.value = null;
  try {
    await createAdminAccount({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      username: form.username,
      role: "admin",
    });
    success.value = "Da tao admin con thanh cong.";
    form.email = "";
    form.password = "";
    form.fullName = "";
    form.username = "";
    await loadProfiles();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Khong the tao admin con.";
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadProfiles();
});
</script>

<template>
  <section class="admin-accounts">
    <article class="card">
      <div class="card__body">
        <p class="admin-accounts__eyebrow">Master admin</p>
        <h1 class="admin-accounts__title">Tạo tài khoản admin con</h1>
        <p class="muted admin-accounts__copy">
          Chỉ master admin mới truy cập được màn này. Admin con có toàn quyền thao tác orders nhưng không tạo được admin khác.
        </p>

        <form class="admin-accounts__form" @submit.prevent="submit">
          <label class="admin-accounts__field">
            <span>Email</span>
            <input v-model="form.email" class="input" type="email" required />
          </label>
          <label class="admin-accounts__field">
            <span>Password</span>
            <input v-model="form.password" class="input" type="password" minlength="8" required />
          </label>
          <label class="admin-accounts__field">
            <span>Họ tên</span>
            <input v-model="form.fullName" class="input" type="text" />
          </label>
          <label class="admin-accounts__field">
            <span>Username</span>
            <input v-model="form.username" class="input" type="text" />
          </label>
          <button class="btn btn--primary" type="submit" :disabled="saving">
            {{ saving ? "Dang tao..." : "Tao admin con" }}
          </button>
        </form>

        <p v-if="success" class="admin-accounts__message admin-accounts__message--success">{{ success }}</p>
        <p v-if="error" class="admin-accounts__message admin-accounts__message--error">{{ error }}</p>
      </div>
    </article>

    <article class="card">
      <div class="card__body">
        <h2 class="admin-accounts__section-title">Danh sách tài khoản</h2>
        <p class="muted admin-accounts__copy">Phục vụ theo dõi role hiện tại và tài khoản do master admin tạo.</p>

        <div v-if="loading" class="admin-accounts__empty">Dang tai danh sach...</div>
        <div v-else class="admin-accounts__list">
          <article v-for="profile in profiles" :key="profile.id" class="admin-accounts__item">
            <div>
              <h3>{{ profile.full_name || profile.username || profile.id }}</h3>
              <p>{{ profile.id }}</p>
            </div>
            <div class="admin-accounts__tags">
              <span class="admin-accounts__tag">{{ profile.role }}</span>
              <span class="admin-accounts__tag admin-accounts__tag--muted">{{ profile.username || "no-username" }}</span>
            </div>
          </article>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.admin-accounts,
.admin-accounts__list,
.admin-accounts__form {
  display: grid;
  gap: 22px;
}

.admin-accounts__eyebrow {
  margin: 0 0 10px;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 11px;
  font-weight: 700;
}

.admin-accounts__title,
.admin-accounts__section-title {
  margin: 0 0 10px;
}

.admin-accounts__title {
  font-size: clamp(30px, 5vw, 44px);
}

.admin-accounts__copy {
  margin: 0 0 18px;
}

.admin-accounts__field span {
  display: block;
  margin-bottom: 6px;
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.admin-accounts__item {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
}

.admin-accounts__item h3,
.admin-accounts__item p {
  margin: 0;
}

.admin-accounts__item p {
  color: var(--muted);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.admin-accounts__tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.admin-accounts__tag {
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(123, 224, 195, 0.12);
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
}

.admin-accounts__tag--muted {
  background: rgba(255, 255, 255, 0.04);
  color: var(--muted);
}

.admin-accounts__message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
}

.admin-accounts__message--success {
  color: var(--accent);
  background: rgba(123, 224, 195, 0.08);
}

.admin-accounts__message--error {
  color: var(--danger);
  background: rgba(255, 127, 114, 0.08);
}

.admin-accounts__empty {
  padding: 20px;
  text-align: center;
  color: var(--muted);
}

@media (max-width: 720px) {
  .admin-accounts__form .btn {
    width: 100%;
  }
}
</style>
