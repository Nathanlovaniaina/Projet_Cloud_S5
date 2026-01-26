<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      
      <ion-tab-bar slot="bottom" class="modern-tab-bar">
        <ion-tab-button tab="add" href="/tabs/add" class="tab-button">
          <ion-icon :icon="addCircleOutlineIcon" class="tab-icon"></ion-icon>
        </ion-tab-button>
        
        <ion-tab-button tab="map" href="/tabs/map" class="tab-button tab-button-center">
          <ion-icon :icon="mapIcon" class="tab-icon tab-icon-center"></ion-icon>
        </ion-tab-button>
        
        <ion-tab-button tab="profile" href="/tabs/profile" class="tab-button">
          <ion-icon :icon="personIcon" class="tab-icon"></ion-icon>
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
  addCircleOutline as addCircleOutlineIcon 
} from 'ionicons/icons';
</script>

<style scoped>
.modern-tab-bar {
  --background: var(--ion-background-color);
  --color: var(--ion-color-medium);
  border-top: 1px solid var(--ion-color-light);
  height: 70px;
  padding-bottom: 8px;
  padding-top: 8px;
}

.tab-button {
  --color: var(--ion-color-medium);
  --color-selected: var(--ion-color-primary);
  --padding-top: 8px;
  --padding-bottom: 8px;
}

.tab-button-center {
  position: relative;
}

.tab-icon {
  font-size: 28px;
  transition: all 0.3s ease;
}

.tab-icon-center {
  font-size: 42px;
  color: var(--ion-color-primary);
}

.tab-button::part(native) {
  transition: all 0.3s ease;
}

ion-tab-button.tab-selected .tab-icon {
  transform: scale(1.1);
  color: var(--ion-color-primary);
}

ion-tab-button.tab-selected .tab-icon-center {
  transform: scale(1.15);
}

/* Animation smooth */
.tab-button:active {
  opacity: 0.7;
}
</style>
