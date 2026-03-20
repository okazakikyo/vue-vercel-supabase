import type { Session } from "@supabase/supabase-js";
import { defineStore } from "pinia";

import { fetchMyProfile, type AppRole, type ProfileRecord } from "@/lib/profileService";
import { supabase } from "@/lib/supabase";

type AuthState = {
  initialized: boolean;
  session: Session | null;
  profile: ProfileRecord | null;
};

let initPromise: Promise<void> | null = null;
let authListenerRegistered = false;

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    initialized: false,
    session: null,
    profile: null,
  }),
  getters: {
    user: (state) => state.session?.user ?? null,
    role: (state): AppRole | null => state.profile?.role ?? null,
    isAdmin: (state) => state.profile?.role === "admin" || state.profile?.role === "master_admin",
    isMasterAdmin: (state) => state.profile?.role === "master_admin",
  },
  actions: {
    async refreshProfile() {
      if (!this.session) {
        this.profile = null;
        return null;
      }

      this.profile = await fetchMyProfile();
      return this.profile;
    },
    async init() {
      if (this.initialized) {
        return;
      }

      if (initPromise) {
        await initPromise;
        return;
      }

      initPromise = (async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        this.session = data.session;
        await this.refreshProfile();

        if (!authListenerRegistered) {
          authListenerRegistered = true;
          supabase.auth.onAuthStateChange(async (_event, session) => {
            this.session = session;
            await this.refreshProfile();
          });
        }

        this.initialized = true;
      })();

      try {
        await initPromise;
      } finally {
        initPromise = null;
      }
    },
    async signInWithPassword(email: string, password: string) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      this.session = data.session;
      await this.refreshProfile();
    },
    async signUp(email: string, password: string) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      this.session = data.session;
      await this.refreshProfile();
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      this.session = null;
      this.profile = null;
    },
  },
});
