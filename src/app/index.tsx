import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';


export default function Index() {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const deviceKey = await SecureStore.getItemAsync('deviceKey');
        const token = await SecureStore.getItemAsync('userToken');

        // Por seguridad 1 a 1, cada inicio de app debe validarse por biometría en el Login
        router.replace('/login' as any);
      } catch (error) {
        console.error('Error verificando session', error);
        router.replace('/login' as any);
      } finally {
        setIsChecking(false);
      }
    };
    checkSession();
  }, []);

  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return null;
}


