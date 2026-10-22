import NetworkStatusBar from '@/components/NetworkStatusBar';
import OnboardingModal from '@/components/OnboardingModal';
import { isRunningInExpoGo } from 'expo';
import { Slot, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
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
   if(__DEV__) console.log('Notificaciones no disponibles:', e);
  }
}

 //Tiempo maximo en sgundo plano: de 3 a 5 minutos 
  //para pruebas pasarlo almenos a 5 seg para probar y verificar que tan bien funciona ..
  const TIEMPO_INACTIVIDAD_MS = 5*60*1000;

// Este es el Layout principal de TODA la aplicación.
// Usar <Slot /> significa: "No pongas ningún menú gráfico aquí, 
// solo deja que los archivos y carpetas decidan qué mostrar".
export default function RootLayout() { 
  const pathname = usePathname()
  const backgroundTimeStamp = useRef<number |null >(null);


  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if(nextAppState === 'background'){
        //Guardamos la hora exacta cuando el usuario minimiza la app o bloquea el celular 
        backgroundTimeStamp.current=Date.now();
      } else if(nextAppState === 'active'){
        //Cuando vuelve abrir la app calculamos cuanto tiempo paso afuera
        if(backgroundTimeStamp.current !== null){
          const tiempoFuera = Date.now() - backgroundTimeStamp.current;
          backgroundTimeStamp.current = null;

          if(tiempoFuera > TIEMPO_INACTIVIDAD_MS && pathname !== '/login'){
            router.replace('/login' as any); 
          }
        }
      }
    });

    return () => subscription.remove();
  }, [pathname])
  
  return (
    <SafeAreaProvider>
      <StatusBar style = "dark"/>
      
      <NetworkStatusBar/>
      {/* */}
      <Slot />
      <OnboardingModal />
    </SafeAreaProvider>
  );
}