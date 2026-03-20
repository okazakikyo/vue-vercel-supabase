<script setup lang="ts">
import { Analytics } from "@vercel/analytics/vue";
import { track } from "@vercel/analytics";
import { SpeedInsights } from "@vercel/speed-insights/vue";
import { onMounted, ref } from "vue";

const lastEvent = ref<string | null>(null);

onMounted(() => {
  track("dashboard_view");
  lastEvent.value = "dashboard_view";
});

function trackCta() {
  track("dashboard_analytics_cta_click");
  lastEvent.value = "dashboard_analytics_cta_click";
}
</script>

<template>
  <Analytics />
  <SpeedInsights />

  <section class="card analytics-card">
    <div class="card__body analytics-card__body">
      <div class="analytics-card__head">
        <div>
          <p class="analytics-card__eyebrow">Observability</p>
          <h2 class="analytics-card__title">Analytics</h2>
          <p class="muted analytics-card__copy">
            Web Analytics đang được bật trên Vercel cho hệ thống quản lý orders chung cho người dùng.
          </p>
        </div>

        <button class="btn btn--primary" type="button" @click="trackCta">Track CTA event</button>
      </div>

      <div class="analytics-card__grid">
        <article class="analytics-metric">
          <span>Runtime</span>
          <strong>Vercel Analytics</strong>
          <p class="muted">Theo dõi page view và event cho khu quản lý orders theo từng phiên truy cập.</p>
        </article>
        <article class="analytics-metric">
          <span>Last event</span>
          <strong><code>{{ lastEvent ?? "—" }}</code></strong>
          <p class="muted">CTA trên dashboard giúp kiểm tra event pipeline sau deploy.</p>
        </article>
      </div>

      <div class="analytics-card__table">
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Mô tả</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>dashboard_view</code></td>
              <td>Fire khi vào trang tổng quan hệ thống</td>
              <td>
                <span class="muted">{{ lastEvent === "dashboard_view" ? "Tracked" : "—" }}</span>
              </td>
            </tr>
            <tr>
              <td>
                <code>dashboard_analytics_cta_click</code>
              </td>
              <td>Fire khi bấm nút “Track CTA event”</td>
              <td>
                <span class="muted">{{ lastEvent === "dashboard_analytics_cta_click" ? "Tracked" : "—" }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="muted analytics-card__footer">Xem số liệu trong Vercel Dashboard → Analytics.</p>
    </div>
  </section>
</template>

<style scoped>
.analytics-card__body {
  display: grid;
  gap: 20px;
  padding: 30px;
}

.analytics-card__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  flex-wrap: wrap;
}

.analytics-card__eyebrow {
  margin: 0 0 10px;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 11px;
  font-weight: 700;
}

.analytics-card__title {
  margin: 0 0 8px;
  font-size: 32px;
}

.analytics-card__copy {
  margin: 0;
}

.analytics-card__grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.analytics-metric {
  padding: 18px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.03);
}

.analytics-metric span,
.analytics-metric strong,
.analytics-metric p {
  display: block;
  margin: 0;
}

.analytics-metric span {
  margin-bottom: 8px;
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.analytics-metric strong {
  margin-bottom: 8px;
  font-size: 18px;
}

.analytics-card__table {
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.02);
}

.analytics-card__table table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 14px 16px;
  text-align: left;
}

thead th {
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

tbody td {
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.analytics-card__footer {
  margin: 0;
}

@media (max-width: 720px) {
  .analytics-card__body {
    padding: 22px;
    gap: 16px;
  }

  .analytics-card__grid {
    grid-template-columns: 1fr;
  }

  .analytics-card__head .btn {
    width: 100%;
  }
}
</style>
