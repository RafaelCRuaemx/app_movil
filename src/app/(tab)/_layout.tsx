import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0d6efd', // Azul marino muy oscuro
        tabBarInactiveTintColor: '#94a3b8', // Gris claro
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
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
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "home" : 'home-outline'} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: 'HISTORIAL',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'PERFIL',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person': 'person-outline'} size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}