import { Usuario } from "@/types";
import { router } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";


export function useUser(){
    const [user, setUser] = useState<Usuario | null>(null);
    const [loading, setLoading] = useState(true);

    //2 Funcion interna para leer la session guardada en el telefono
    const cargarUsuario = useCallback(async() =>{
        try {
            const stored = await SecureStore.getItemAsync('userData');
            if (stored) {
                setUser(JSON.parse(stored));
            } else {
                setUser(null);
            }
        } catch (error) {
            if (__DEV__) console.log('Error al leer usuario de SecureStore:', error);
            setUser(null);
        }finally{
            setLoading(false);
        }
    },[]);

    //3. se ejecuta automaticamente en cuanto la pantalla se monta 
    useEffect(() => {
        cargarUsuario();
    }, [cargarUsuario]);

    //4. Logica centralizada de cerrar session con confirmación
    const logout = () =>{
        Alert.alert("Cerrar sesión",
            "¿Estás seguro de que deseas cerrar tu sessión actual?",
            [
                {text: "Cancelar", style:"cancel"},
                {
                    text: "Cerrar sesión",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Limpiamos los tokens y cachés de forma segura
                            await SecureStore.deleteItemAsync('userToken');
                            await SecureStore.deleteItemAsync('userData');
                            await SecureStore.deleteItemAsync('cached_dashboard');
                            
                            setUser(null);
                            // Redirigimos al login
                            router.replace('/login' as any);
                        } catch (e) {
                            if(__DEV__) console.log('Error durante el logout: ', e);
                        }
                    }
                }
            ]
        );
    };

    //5. Retomamos los datos y funciones para que cualquier pantalla los use 
    return{
        user,
        loading,
        logout,
        recargarUsuario: cargarUsuario
    };
}