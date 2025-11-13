import { RouteConfig } from 'vue-router';
function loadView(view: string) {
  return () =>
    import(/* webpackChunkName: "view-[request]" */ `../pages/${view}.vue`);
}
const routes: RouteConfig[] = [
  {
    path: '/',
    meta: { requiresAuth: true },
    // redirect: "/Home",
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '/',
        name: 'Home',
        meta: { requiresAuth: true, hideAddIssueBtn: true },
        component: () => import('pages/Home.vue'),
      },
    ]
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('pages/Login.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('pages/profile.vue'),
  },

  {
    path: '/csd/join/:uuid',
    name: 'join',
    component: () => import('pages/Register.vue'),
  },
  {
    path: '*',
    component: () => import('pages/Error404.vue'),
  },
];

export default routes;
