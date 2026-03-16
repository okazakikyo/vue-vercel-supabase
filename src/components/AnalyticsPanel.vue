<script setup lang="ts">
import { Analytics } from "@vercel/analytics/vue";
import { track } from "@vercel/analytics";
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
  <!-- Inject Vercel Web Analytics (no visible UI) -->
  <Analytics />

  <section class="card">
    <div class="card__body">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap">
        <div>
          <h2 style="margin: 0 0 6px">Analytics</h2>
          <p class="muted" style="margin: 0">
            Web Analytics đang được bật trên Vercel. Panel này chỉ để track custom events demo.
          </p>
        </div>

        <button class="btn btn--primary" type="button" @click="trackCta">Track CTA event</button>
      </div>

      <div class="spacer"></div>

      <div style="overflow: auto">
        <table style="width: 100%; border-collapse: collapse">
          <thead>
            <tr>
              <th style="text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--border)">Event</th>
              <th style="text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--border)">Mô tả</th>
              <th style="text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--border)">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 10px 8px; border-bottom: 1px solid var(--border)"><code>dashboard_view</code></td>
              <td style="padding: 10px 8px; border-bottom: 1px solid var(--border)">Fire khi vào trang Dashboard</td>
              <td style="padding: 10px 8px; border-bottom: 1px solid var(--border)">
                <span class="muted">{{ lastEvent === "dashboard_view" ? "Tracked" : "—" }}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 8px; border-bottom: 1px solid var(--border)">
                <code>dashboard_analytics_cta_click</code>
              </td>
              <td style="padding: 10px 8px; border-bottom: 1px solid var(--border)">Fire khi bấm nút “Track CTA event”</td>
              <td style="padding: 10px 8px; border-bottom: 1px solid var(--border)">
                <span class="muted">{{ lastEvent === "dashboard_analytics_cta_click" ? "Tracked" : "—" }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="spacer"></div>
      <p class="muted" style="margin: 0">Xem số liệu trong Vercel Dashboard → Analytics.</p>
    </div>
  </section>
</template>

