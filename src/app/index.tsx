import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function Index() {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const deviceKey = await SecureStore.getItemAsync('deviceKey');
        const token = await SecureStore.getItemAsync('userToken');

        // Si el dispositivo tiene huella digital vinculada, SIEMPRE debe autenticarse en el login
        if (deviceKey) {
          router.replace('/login' as any);
        } else if (token) {
          router.replace('/scanner' as any);
        } else {
          router.replace('/login' as any);
        }
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
