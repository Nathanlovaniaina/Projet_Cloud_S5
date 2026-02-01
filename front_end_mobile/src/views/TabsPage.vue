<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      
      <ion-tab-bar slot="bottom" class="modern-tab-bar">
        <ion-tab-button tab="add" href="/tabs/add" class="tab-button">
          <div class="tab-icon-wrapper">
            <ion-icon :icon="addIcon" class="tab-icon"></ion-icon>
          </div>
          <span class="tab-label">Ajouter</span>
        </ion-tab-button>
        
        <ion-tab-button tab="map" href="/tabs/map" class="tab-button">
          <div class="tab-icon-wrapper">
            <ion-icon :icon="mapIcon" class="tab-icon"></ion-icon>
          </div>
          <span class="tab-label">Carte</span>
        </ion-tab-button>
        
        <ion-tab-button tab="profile" href="/tabs/profile" class="tab-button">
          <div class="tab-icon-wrapper">
            <ion-icon :icon="personIcon" class="tab-icon"></ion-icon>
          </div>
          <span class="tab-label">Profil</span>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonPage, 
  IonTabs, 
  IonTabBar, 
  IonTabButton, 
  IonIcon, 
  IonRouterOutlet 
} from '@ionic/vue';
import { 
  map as mapIcon, 
  person as personIcon, 
  add as addIcon
} from 'ionicons/icons';
</script>

<style scoped>
.modern-tab-bar {
  --background: #F3F4F6;
  border: none;
  height: 70px;
  padding: 0;
  position: relative;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.tab-button {
  --color: #9CA3AF;
  --color-selected: #3B82F6;
  --padding-top: 0;
  --padding-bottom: 0;
  margin: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.tab-button::part(native) {
  background: transparent;
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.tab-icon-wrapper {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.tab-icon {
  font-size: 24px;
  color: #9CA3AF;
  transition: all 0.3s ease;
}

.tab-label {
  font-size: 12px;
  font-weight: 500;
  color: #9CA3AF;
  transition: all 0.3s ease;
  white-space: nowrap;
}

/* Tab sélectionné */
ion-tab-button.tab-selected .tab-icon {
  color: #3B82F6;
}

ion-tab-button.tab-selected .tab-label {
  color: #3B82F6;
  font-weight: 600;
}

/* Indicateur EN HAUT de l'onglet actif */
ion-tab-button.tab-selected::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 90px;
  height: 3px;
  background: #3B82F6;
  border-radius: 0 0 2px 2px;
}

/* Animation au clic */
.tab-button:active .tab-icon {
  transform: scale(0.9);
}

/* Responsive */
@media (max-width: 375px) {
  .tab-icon {
    font-size: 22px;
  }
  
  .tab-label {
    font-size: 11px;
  }
}
</style>
