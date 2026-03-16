import type { Session } from "@supabase/supabase-js";
import { defineStore } from "pinia";

import { supabase } from "@/lib/supabase";

type AuthState = {
  initialized: boolean;
  session: Session | null;
};

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    initialized: false,
    session: null,
  }),
  getters: {
    user: (state) => state.session?.user ?? null,
  },
  actions: {
    async init() {
      if (this.initialized) return;
      this.initialized = true;

      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      this.session = data.session;

      supabase.auth.onAuthStateChange((_event, session) => {
        this.session = session;
      });
    },
    async signInWithPassword(email: string, password: string) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      this.session = data.session;
    },
    async signUp(email: string, password: string) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      this.session = data.session;
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      this.session = null;
    },
  },
});

