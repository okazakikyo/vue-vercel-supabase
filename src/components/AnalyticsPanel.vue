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
            Web Analytics đang được bật trên Vercel. Panel này chỉ để track custom events demo.
          </p>
        </div>

        <button class="btn btn--primary" type="button" @click="trackCta">Track CTA event</button>
      </div>

      <div class="spacer"></div>

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
              <td>Fire khi vào trang Dashboard</td>
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

      <div class="spacer"></div>
      <p class="muted analytics-card__copy">Xem số liệu trong Vercel Dashboard → Analytics.</p>
    </div>
  </section>
</template>

<style scoped>
.analytics-card__body {
  padding: 28px;
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

@media (max-width: 720px) {
  .analytics-card__body {
    padding: 20px;
  }
}
</style>
