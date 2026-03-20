<script setup lang="ts"></script>

<template>
  <section class="not-found">
    <article class="card not-found__card">
      <div class="card__body not-found__body">
        <p class="not-found__eyebrow">404</p>
        <h1 class="not-found__title">Trang này không tồn tại.</h1>
        <p class="muted not-found__copy">
          Bạn có thể quay về trang chủ hoặc vào khu quản lý orders chung cho người dùng để tiếp tục thao tác.
        </p>

        <div class="row not-found__actions">
          <RouterLink class="btn btn--primary not-found__link" to="/">Về trang chủ</RouterLink>
          <RouterLink class="btn not-found__link" to="/orders">Mở quản lý orders</RouterLink>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.not-found {
  display: grid;
  place-items: center;
  min-height: min(74vh, 720px);
}

.not-found__card {
  max-width: 720px;
  width: 100%;
}

.not-found__body {
  padding: 38px;
  text-align: center;
}

.not-found__eyebrow {
  margin: 0 0 12px;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 11px;
  font-weight: 700;
}

.not-found__title {
  margin: 0 0 14px;
  font-size: clamp(34px, 6vw, 58px);
}

.not-found__copy {
  margin: 0 auto 20px;
  max-width: 52ch;
}

.not-found__actions {
  justify-content: center;
}

.not-found__link {
  text-decoration: none;
}

@media (max-width: 720px) {
  .not-found__body {
    padding: 24px;
  }

  .not-found__actions {
    flex-direction: column;
  }

  .not-found__link {
    width: 100%;
    text-align: center;
  }
}
</style>
