/**
 * Configuración centralizada de APIs y Endpoints del Checador Móvil.
 * Lee la variable EXPO_PUBLIC_API_URL definida en el archivo .env,
 * o utiliza la IP local de desarrollo como respaldo de contingencia.
 */
export const API_URL: string = 
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost/backend/api';

