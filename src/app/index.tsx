import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index(){
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    const checkSession = async ()=>{
           try {
        // Buscamos si existe un token guardado previamente 
        const token = await SecureStore.getItemAsync('userToken');

        if(token){
          // Si SÍ hay sesión, lo mandamos al dashboard (tab)
          router.replace('/(tab)');
        } else {
          // Si NO hay sesión, lo mandamos al login
          router.replace('/login' as any);
        }
      } catch(error) {
        console.error('Error verificando session', error);
        router.replace('/login' as any);
      } finally {
        setIsChecking(false);
      }
    };
    checkSession();
  },[]);
  // Mientras verifica la memoria del teléfono, mostramos un ícono de carga
  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
  return null;
}


