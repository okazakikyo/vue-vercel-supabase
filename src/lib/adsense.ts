declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE_SCRIPT_ID = "google-adsense-script";

export function isAdsEnabled() {
  return import.meta.env.VITE_ADSENSE_ENABLED === "true";
}

export function isAutoAdsEnabled() {
  return import.meta.env.VITE_ADSENSE_AUTO_ADS !== "false";
}

export async function loadAdSenseScript(client: string) {
  if (!client) {
    return;
  }

  const existing = document.getElementById(ADSENSE_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = ADSENSE_SCRIPT_ID;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google AdSense script."));
    document.head.appendChild(script);
  });
}

export function pushAd() {
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (error) {
    console.warn("AdSense push failed", error);
  }
}

