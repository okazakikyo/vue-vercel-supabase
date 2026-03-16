<script setup lang="ts"></script>

<template>
  <header class="header">
    <div class="container header__inner">
      <RouterLink class="brand" to="/">Vue + Supabase</RouterLink>
      <nav class="nav">
        <RouterLink class="nav__link" to="/">Home</RouterLink>
        <RouterLink class="nav__link" to="/dashboard">Dashboard</RouterLink>
        <RouterLink class="nav__link" to="/login">Login</RouterLink>
      </nav>
    </div>
  </header>

  <main class="container main">
    <RouterView />
  </main>
</template>

<style scoped>
.header {
  border-bottom: 1px solid var(--border);
  background: color-mix(in oklab, var(--surface) 90%, transparent);
  position: sticky;
  top: 0;
  backdrop-filter: blur(10px);
}
.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  gap: 16px;
}
.brand {
  font-weight: 700;
  letter-spacing: -0.02em;
  text-decoration: none;
  color: var(--text);
}
.nav {
  display: flex;
  gap: 12px;
  align-items: center;
}
.nav__link {
  color: var(--muted);
  text-decoration: none;
  font-weight: 600;
}
.nav__link.router-link-active {
  color: var(--text);
}
.main {
  padding: 28px 0;
}
</style>

