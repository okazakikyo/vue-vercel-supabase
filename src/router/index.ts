import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import DashboardView from "@/views/DashboardView.vue";
import HomeView from "@/views/HomeView.vue";
import LoginView from "@/views/LoginView.vue";
import NotFoundView from "@/views/NotFoundView.vue";
import AdminAccountsView from "@/views/AdminAccountsView.vue";
import AdminOrdersView from "@/views/AdminOrdersView.vue";
import UserOrdersView from "@/views/UserOrdersView.vue";
import UserDashboardView from "@/views/UserDashboardView.vue";
import type { AppRole } from "@/lib/profileService";

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    guestOnly?: boolean;
    roles?: AppRole[];
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "home", component: HomeView },
    { path: "/login", name: "login", component: LoginView, meta: { guestOnly: true } },
    { path: "/dashboard", name: "dashboard", component: DashboardView, meta: { requiresAuth: true } },
    { path: "/user/dashboard", name: "user-dashboard", component: UserDashboardView, meta: { requiresAuth: true } },
    { path: "/user/orders", name: "user-orders", component: UserOrdersView },
    {
      path: "/admin/dashboard",
      name: "admin-dashboard",
      component: DashboardView,
      meta: { requiresAuth: true, roles: ["admin", "master_admin"] },
    },
    {
      path: "/admin/orders",
      name: "admin-orders",
      component: AdminOrdersView,
      meta: { requiresAuth: true, roles: ["admin", "master_admin"] },
    },
    {
      path: "/admin/accounts",
      name: "admin-accounts",
      component: AdminAccountsView,
      meta: { requiresAuth: true, roles: ["master_admin"] },
    },
    { path: "/orders", redirect: { name: "user-orders" } },
    { path: "/:pathMatch(.*)*", name: "not-found", component: NotFoundView },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.init();
  if (to.meta.requiresAuth && !auth.session) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
  if (to.meta.guestOnly && auth.session) {
    return auth.isAdmin ? { name: "admin-dashboard" } : { name: "user-dashboard" };
  }
  if (to.meta.roles?.length) {
    if (!auth.role || !to.meta.roles.includes(auth.role)) {
      return auth.isAdmin ? { name: "admin-dashboard" } : { name: "user-dashboard" };
    }
  }
  if (to.name === "dashboard") {
    return auth.isAdmin ? { name: "admin-dashboard" } : { name: "user-dashboard" };
  }
});

export default router;
