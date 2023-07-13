import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/music',
    component: () => import('@v/music/index.vue')
  },
  {
    path: '/login',
    component: () => import('@v/login/login.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes: routes
})

export default router
