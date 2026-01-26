import { ref } from 'vue';
import { Geolocation } from '@capacitor/geolocation';

export const userLocation = ref<{ lat: number; lng: number } | null>(null);
export const geoError = ref<string | null>(null);
export const loading = ref(false);

export async function getCurrentPosition() {
  loading.value = true;
  geoError.value = null;
  try {
    const coordinates = await Geolocation.getCurrentPosition();
    const { latitude, longitude } = coordinates.coords;
    userLocation.value = { lat: latitude, lng: longitude };
    return userLocation.value;
  } catch (err: any) {
    geoError.value = err.message || 'Erreur de géolocalisation';
    console.error('Geolocation error:', err);
    return null;
  } finally {
    loading.value = false;
  }
}

export async function watchPosition(callback?: (pos: { lat: number; lng: number }) => void) {
  try {
    const watchId = await Geolocation.watchPosition(
      {},
      (position) => {
        if (position) {
          const { latitude, longitude } = position.coords;
          userLocation.value = { lat: latitude, lng: longitude };
          callback?.({ lat: latitude, lng: longitude });
        }
      }
    );
    return watchId;
  } catch (err: any) {
    geoError.value = err.message;
    return null;
  }
}

export async function clearWatch(watchId: string) {
  if (watchId) {
    await Geolocation.clearWatch({ id: watchId });
  }
}
