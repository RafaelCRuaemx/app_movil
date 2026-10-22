import NetInfo from '@react-native-community/netinfo';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

/**
 * configuracion centralizada de APIs y endpoints del Checador Movil.
 * Lee la variable EXPO_PUBLIC_aPI_URL definida en el archivo .env o en eas.json
 */

export const API_URL: string = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/+$/,'');

/**
 * Cliente http centralizado con Timeout automatico (10s por defecto),
 * inyeccion automatica de Authorization Beare + X-Device-Key y cierre ante 401
 */export async function apiPost<T = any>(
  endpoint: string,
  body: Record<string, any> = {},
  timeoutMs: number = 10000
): Promise<T> {
  if (!API_URL) {
    throw new Error('Configuración incompleta: falta definir EXPO_PUBLIC_API_URL en .env');
  }

  // Verificar si el teléfono tiene conexión activa
  const netState = await NetInfo.fetch();
  if (netState.isConnected === false) {
    throw new Error('Sin conexión a internet. Verifica tu Wi-Fi o datos móviles.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const [deviceKey, userToken] = await Promise.all([
      SecureStore.getItemAsync('deviceKey'),
      SecureStore.getItemAsync('userToken'),
    ]);

    const res = await fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(deviceKey ? { 'X-Device-Key': deviceKey } : {}),
        ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    // Si el servidor indica 401 (token inválido o expirado), limpiar sesión y redirigir al login
    if (res.status === 401) {
      await Promise.all([
        SecureStore.deleteItemAsync('userToken'),
        SecureStore.deleteItemAsync('userData'),
        SecureStore.deleteItemAsync('cached_dashboard'),
      ]);
      router.replace('/login' as any);
      throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
    }

    const responseText = await res.text();
    try {
      return JSON.parse(responseText) as T;
    } catch {
      throw new Error('Respuesta no válida del servidor: ' + responseText.substring(0, 80));
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('El servidor tardó demasiado en responder (10s). Verifica tu conexión.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}