import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '../views/HomePage.vue'
import LoginPage from '../views/LoginPage.vue'
import UserProfile from '../views/UserProfile.vue'
import { loadUserFromStorage, currentUser } from '../composables/useAuth';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage
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
  } else {
    next();
  }
});

export default router
