import { isRunningInExpoGo } from 'expo';
import * as SecureStore from 'expo-secure-store';

const NOTIF_KEY = 'comida_notification_id';

// Obtiene el módulo de notificaciones de forma segura (en Expo Go en Android no se carga para evitar excepciones del SDK 53+)
const getNotificationsModule = () => {
  if (isRunningInExpoGo()) {
    return null;
  }
  try {
    return require('expo-notifications');
  } catch {
    return null;
  }
};

// 1. Pedir permisos al sistema operativo
export async function pedirPermisosNotificaciones(): Promise<boolean> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (e) {
    console.log('Error pidiendo permisos de notificación:', e);
    return false;
  }
}

// 2. Programar alerta de comida (por defecto a los 45/55 minutos)
export async function programarAlertaComida(minutosAlerta: number = 45): Promise<void> {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    console.log('Notificaciones omitidas (entorno Expo Go)');
    return;
  }

  try {
    const tienePermiso = await pedirPermisosNotificaciones();
    if (!tienePermiso) return;

    // Si ya había una alerta previa, cancelarla antes de crear una nueva
    await cancelarAlertaComida();

    const segundos = minutosAlerta * 60;

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Regreso de Comida',
        body: 'Tu hora de comida está por concluir. Tienes 5 minutos de tolerancia para registrar tu regreso a tiempo.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: segundos,
      },
    });

    // Guardar el ID para poder cancelarla si regresa antes
    await SecureStore.setItemAsync(NOTIF_KEY, notifId);
  } catch (error) {
    console.log('Error programando alerta de comida:', error);
  }
}

// 3. Cancelar la alerta si el colaborador ya regresó y checó
export async function cancelarAlertaComida(): Promise<void> {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  try {
    const notifId = await SecureStore.getItemAsync(NOTIF_KEY);
    if (notifId) {
      await Notifications.cancelScheduledNotificationAsync(notifId);
      await SecureStore.deleteItemAsync(NOTIF_KEY);
    }
  } catch (error) {
    console.log('Error cancelando alerta de comida:', error);
  }
}