import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '../views/HomePage.vue'
import LoginPage from '../views/LoginPage.vue'
import TabsPage from '../views/TabsPage.vue'
import MapPage from '../views/MapPage.vue'
import AddSignalementPage from '../views/AddSignalementPage.vue'
import ProfilePage from '../views/ProfilePage.vue'
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
    path: '/tabs',
    component: TabsPage,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/tabs/map'
      },
      {
        path: 'map',
        name: 'Map',
        component: MapPage
      },
      {
        path: 'add',
        name: 'AddSignalement',
        component: AddSignalementPage
      },
      {
        path: 'profile',
        name: 'Profile',
        component: ProfilePage
      }
    ]
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
      // Non connecté, rediriger vers home
      next('/home');
    }
  } else if ((to.path === '/login' || to.path === '/home') && currentUser.value) {
    // Si connecté et essaye d'aller au login ou home, rediriger vers tabs
    next('/tabs/map');
  } else {
    next();
  }
});

export default router
