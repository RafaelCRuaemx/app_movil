import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
/**
 * Configuración centralizada de APIs y Endpoints del Checador Móvil.
 * Lee la variable EXPO_PUBLIC_API_URL definida en el archivo .env,
 * o utiliza la IP local de desarrollo como respaldo de contingencia.
 */
export const API_URL: string = 
  process.env.EXPO_PUBLIC_API_URL || 'https://decompose-grandpa-civic.ngrok-free.dev/UAEMex/wsl/Checador/backend/api';

/**
 * Cliente HTTP centralizado con Timeout automático (10s por defecto),
 * inyección automática de deviceKey y validación segura de JSON.
 */
export async function apiPost<T = any>(
  endpoint: string,
  body: Record<string, any> = {},
  timeoutMs: number = 10000
): Promise<T> {
  //verififcar si el telefono tiene conexion activa
  const netState = await NetInfo.fetch();
  if (netState.isConnected === false) {
    throw new Error('Sin conexion a internet. Verifica tu Wi-Fi o datos moviles');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const deviceKey = await SecureStore.getItemAsync('deviceKey');

    const res = await fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(deviceKey ? { 'X-Device-Key': deviceKey } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

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
