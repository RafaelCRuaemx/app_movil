# 📱 Checador Móvil - App de Asistencia Institucional

Aplicación móvil desarrollada con **React Native** y **Expo (SDK 57)** para el registro de asistencia laboral mediante código QR dinámico (TOTP), geocercas y biometría dactilar/Face ID.

---

## 🚀 Requisitos y Configuración Inicial

1. **Instalar dependencias:**
   ```bash
   npm install


   2. **Variables de Entorno:**
   Copia el archivo de plantilla `.env.example` como `.env`:
   ```bash
   cp .env.example .env

   EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL/UAEMex/wsl/Checador/backend/api

   npm start            # Iniciar servidor de desarrollo de Expo
npm run android      # Abrir directamente en Android
npm run typecheck    # Validar tipos TypeScript sin compilar
