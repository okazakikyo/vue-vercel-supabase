<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";

import { isAdsEnabled, loadAdSenseScript, pushAd } from "@/lib/adsense";

const adElement = ref<HTMLElement | null>(null);
const dismissed = ref(false);
const isMobile = ref(false);

const client = import.meta.env.VITE_ADSENSE_CLIENT?.trim() ?? "";
const slot = import.meta.env.VITE_ADSENSE_SLOT_FOOTER?.trim() ?? "";
const enabled = computed(
  () => isAdsEnabled() && Boolean(client) && Boolean(slot) && !dismissed.value,
);
const adStyle = computed(() =>
  isMobile.value
    ? "display:inline-block;width:320px;max-width:100%;height:50px"
    : "display:block;width:100%;height:90px",
);

let mediaQuery: MediaQueryList | null = null;
let handleMediaQueryChange: ((event: MediaQueryListEvent) => void) | null = null;

async function renderAd() {
  if (!enabled.value) {
    return;
  }

  await loadAdSenseScript(client);
  await nextTick();

  if (adElement.value && adElement.value.dataset.loaded !== "true") {
    pushAd();
    adElement.value.dataset.loaded = "true";
  }
}

function syncBodyClass() {
  document.body.classList.toggle("has-fixed-ad", enabled.value);
}

onMounted(async () => {
  mediaQuery = window.matchMedia("(max-width: 720px)");
  isMobile.value = mediaQuery.matches;

  handleMediaQueryChange = (event: MediaQueryListEvent) => {
    isMobile.value = event.matches;
  };

  mediaQuery.addEventListener("change", handleMediaQueryChange);

  syncBodyClass();
  await renderAd();
});

watch(enabled, async () => {
  syncBodyClass();
  await renderAd();
});

onUnmounted(() => {
  if (mediaQuery && handleMediaQueryChange) {
    mediaQuery.removeEventListener("change", handleMediaQueryChange);
  }
  document.body.classList.remove("has-fixed-ad");
});

function closeAd() {
  dismissed.value = true;
  document.body.classList.remove("has-fixed-ad");
}
</script>

<template>
  <aside v-if="enabled" class="google-ad-bar" aria-label="Advertisement">
    <div class="google-ad-bar__inner">
      <div class="google-ad-bar__top">
        <span class="google-ad-bar__label">Sponsored</span>
        <button
          class="google-ad-bar__close"
          type="button"
          aria-label="Close ad"
          @click="closeAd"
        >
          ×
        </button>
      </div>
      <ins
        ref="adElement"
        class="adsbygoogle google-ad-bar__slot"
        :style="adStyle"
        :data-ad-client="client"
        :data-ad-slot="slot"
        :data-ad-format="isMobile ? 'horizontal' : 'auto'"
        data-full-width-responsive="true"
      />
    </div>
  </aside>
</template>

<style scoped>
/* .google-ad-bar {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  width: min(92vw, 760px);
  bottom: calc(14px + env(safe-area-inset-bottom));
  z-index: 50;
  pointer-events: none;
} */

.google-ad-bar__inner {
  width: 100%;
  padding: 8px 10px 10px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(7, 20, 26, 0.92);
  box-shadow: 0 18px 40px rgba(2, 10, 14, 0.34);
  backdrop-filter: blur(18px);
  pointer-events: auto;
}

.google-ad-bar__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
}

.google-ad-bar__label {
  display: inline-block;
  color: var(--muted);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-weight: 700;
}

.google-ad-bar__close {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: var(--muted);
  width: 26px;
  height: 26px;
  border-radius: 999px;
  cursor: pointer;
  line-height: 1;
}

.google-ad-bar__slot {
  width: 100%;
  min-height: 50px;
  max-height: 90px;
  overflow: hidden;
  border-radius: 10px;
}

@media (max-width: 720px) {
  .google-ad-bar {
    width: min(calc(100vw - 18px), 344px);
    bottom: calc(8px + env(safe-area-inset-bottom));
  }

  .google-ad-bar__inner {
    padding: 4px 6px 6px;
    border-radius: 14px;
  }

  .google-ad-bar__slot {
    min-height: 50px;
    max-height: 50px;
  }

  .google-ad-bar__label {
    font-size: 8px;
    letter-spacing: 0.12em;
  }

  .google-ad-bar__close {
    width: 22px;
    height: 22px;
    font-size: 14px;
  }
}

@media (max-width: 420px) {
  .google-ad-bar {
    width: calc(100vw - 12px);
    bottom: calc(6px + env(safe-area-inset-bottom));
  }

  .google-ad-bar__inner {
    padding: 4px 5px 6px;
  }

  .google-ad-bar__top {
    margin-bottom: 3px;
  }
}
</style>
