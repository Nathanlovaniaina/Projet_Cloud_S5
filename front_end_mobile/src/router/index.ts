import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HubPage from '../views/HubPage.vue'
import HomePage from '../views/HomePage.vue'
import LoginPage from '../views/LoginPage.vue'
import UserProfile from '../views/UserProfile.vue'
import { loadUserFromStorage, currentUser } from '../composables/useAuth';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/hub'
  },
  {
    path: '/hub',
    name: 'Hub',
    component: HubPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/profile',
    name: 'Profile',
    component: UserProfile,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Global navigation guard
router.beforeEach((to, from, next) => {
  // Charger l'utilisateur depuis localStorage au démarrage
  if (!currentUser.value) {
    loadUserFromStorage();
  }

  if (to.meta.requiresAuth) {
    // Route protégée
    if (currentUser.value) {
      next();
    } else {
      // Non connecté, rediriger vers login
      next('/login');
    }
  } else if (to.path === '/login' && currentUser.value) {
    // Si connecté et essaye d'aller au login, rediriger vers hub
    next('/hub');
  } else {
    next();
  }
});

export default router
