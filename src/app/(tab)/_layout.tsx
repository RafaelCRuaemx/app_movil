import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1e293b', // Azul marino muy oscuro
        tabBarInactiveTintColor: '#94a3b8', // Gris claro
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 0, // quita sombra en android
          shadowOpacity: 0, // quita sombra en ios
        },
        headerShown: false, // Ocultamos el header genérico para personalizar cada pantalla
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: 'bold',
          marginTop: 2,
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'INICIO',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: 'HISTORIAL',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'PERFIL',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}