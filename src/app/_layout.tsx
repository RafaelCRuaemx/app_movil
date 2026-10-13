import { isRunningInExpoGo } from 'expo';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Configurar notificaciones solo en Development Build o APK instalable (Expo Go en Android bloquea expo-notifications desde SDK 53)
if (!isRunningInExpoGo()) {
  try {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.log('Notificaciones no disponibles:', e);
  }
}

// Este es el Layout principal de TODA la aplicación.
// Usar <Slot /> significa: "No pongas ningún menú gráfico aquí, 
// solo deja que los archivos y carpetas decidan qué mostrar".
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  );
}