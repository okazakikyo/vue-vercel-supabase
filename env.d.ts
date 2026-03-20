/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_ADSENSE_CLIENT?: string;
  readonly VITE_ADSENSE_SLOT_FOOTER?: string;
  readonly VITE_ADSENSE_ENABLED?: string;
  readonly VITE_ADSENSE_AUTO_ADS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
