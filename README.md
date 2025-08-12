# 📱 QR Lector App - Andres Huaral

Aplicación Angular para escanear códigos QR y registrar asistencia, configurada para funcionar en red local con HTTPS para acceso a la cámara.

## 📋 **Requisitos Previos**

- Node.js 18+ 
- npm o yarn
- Angular CLI
- PowerShell (Windows) para script automático

## 🚀 **Instalación**

```bash
# Clonar el repositorio
git clone https://github.com/TU_USUARIO/qr-lector-app-andres-huaral.git
cd qr-lector-app-andres-huaral

# Instalar dependencias
npm install

# Instalar Angular CLI globalmente (si no lo tienes)
npm install -g @angular/cli
```

## 🚀 **Configuración Rápida para Nueva Red**

### **Paso 1: Configurar Environment**

1. **Copia el archivo de ejemplo:**
   ```bash
   cp src/environments/environment.example.ts src/environments/environment.ts
   ```

2. **Edita `environment.ts` y cambia `TU_IP` por tu IP real:**
   ```typescript
   apiUrl: 'https://192.168.1.108:30001'  // Tu IP real
   ```

3. **O usa el script automático (Windows):**
   ```bash
   powershell -ExecutionPolicy Bypass -File quick-setup.ps1
   ```

**El script automático hace:**
- ✅ Detecta tu IP actual en la red
- ✅ Actualiza `environment.ts` con la nueva IP
- ✅ Genera certificados SSL para HTTPS
- ✅ Configura todo para funcionar en tu red local

### **Paso 2: Lanzar Aplicación en Desarrollo**

```bash
npm run start -- --ssl --host 0.0.0.0
```

**O usando la ruta completa de Node.js:**
```bash
"C:\Program Files\nodejs\node.exe" "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run start -- --ssl --host 0.0.0.0
```

### **Paso 3: Lanzar Aplicación en Producción**

```bash
# Construir para producción
npm run build -- --configuration production

# Lanzar con HTTPS
npm run start -- --ssl --host 0.0.0.0 --configuration production
```

## 🌐 **URLs de Acceso**

### **Desarrollo:**
- **Local:** `https://localhost:4200`
- **Red local:** `https://TU_IP:4200`

### **Producción:**
- **Local:** `https://localhost:4200`
- **Red local:** `https://TU_IP:4200`

### **Backend:**
- **API:** `https://TU_IP:30001`

## 🔧 **Configuración del Backend**

**IMPORTANTE:** Tu backend debe estar configurado para HTTPS en el puerto 30001.

### **Verificar conectividad:**
- Abre en tu navegador: `https://TU_IP:30001`
- Debe cargar sin errores de certificado

## 🚀 **Despliegue en Producción con Nginx**

### **Windows - Configuración Automática**

```bash
# Ejecutar como Administrador
powershell -ExecutionPolicy Bypass -File setup-windows.ps1
```

**El script automático hace:**
- ✅ Detecta tu IP actual automáticamente
- ✅ Genera certificados SSL para HTTPS
- ✅ Construye la aplicación Angular
- ✅ Descarga e instala Nginx
- ✅ Configura Nginx con HTTPS y proxy al backend
- ✅ Inicia Nginx automáticamente

### **Linux - Configuración Automática**

```bash
# Dar permisos de ejecución
chmod +x setup-linux.sh

# Ejecutar como root
sudo ./setup-linux.sh
```

**El script automático hace:**
- ✅ Detecta tu IP actual automáticamente
- ✅ Genera certificados SSL para HTTPS
- ✅ Instala Nginx desde repositorios
- ✅ Configura Nginx con HTTPS y proxy al backend
- ✅ Configura firewall (UFW)
- ✅ Inicia Nginx como servicio del sistema

### **Configuración Manual de Nginx**

Si prefieres configurar manualmente, los scripts generan:

**Archivo de configuración:** `/etc/nginx/sites-available/qr-lector-app` (Linux) o `C:\nginx\conf\nginx.conf` (Windows)

**Características:**
- **HTTPS obligatorio** - HTTP redirige a HTTPS
- **Proxy al backend** - `/api/` y `/asistencia/` van a puerto 30001
- **SPA routing** - Maneja rutas de Angular correctamente
- **Certificados SSL** - Autofirmados para desarrollo local

### **URLs de Producción**

**Después del despliegue con Nginx:**
- **Frontend:** `https://TU_IP` (redirige automáticamente de HTTP a HTTPS)
- **Backend:** `https://TU_IP:30001` (proxyeado a través de Nginx)

### **Comandos de Control**

**Windows:**
```bash
start-nginx.bat     # Iniciar Nginx
stop-nginx.bat      # Detener Nginx
restart-nginx.bat   # Reiniciar Nginx
```

**Linux:**
```bash
sudo systemctl start nginx      # Iniciar Nginx
sudo systemctl stop nginx       # Detener Nginx
sudo systemctl restart nginx    # Reiniciar Nginx
sudo systemctl status nginx     # Estado de Nginx
```

## 📱 **Características**

- ✅ **HTTPS habilitado** - Para acceso a la cámara
- ✅ **Red local** - Accesible desde cualquier dispositivo en la red
- ✅ **Configuración automática** - Script detecta IP automáticamente
- ✅ **Certificados SSL** - Generados automáticamente
- ✅ **Modo desarrollo y producción** - Ambos con HTTPS
- ✅ **Despliegue con Nginx** - Configuración automática para Windows y Linux
- ✅ **Proxy al backend** - Conexión automática al puerto 30001
- ✅ **Sin IPs hardcodeadas** - Siempre detecta la IP actual

## 🚨 **Solución de Problemas**

### **Error "Mixed Content":**
- **Causa:** Frontend HTTPS intentando conectar a backend HTTP
- **Solución:** Asegúrate de que tu backend use HTTPS en puerto 30001

### **Cámara no funciona:**
- **Causa:** Aplicación no está en HTTPS
- **Solución:** Usa siempre `--ssl` al lanzar

### **No se puede conectar desde celular:**
- **Causa:** IP incorrecta o firewall bloqueando
- **Solución:** Ejecuta `quick-setup.ps1` para detectar IP automáticamente

### **Error 404 en endpoints:**
- **Causa:** Rutas del backend no coinciden
- **Solución:** Verifica que tu backend tenga las rutas `/asistencia/scan` configuradas

## 🔄 **Cuando Cambies de Red WiFi**

1. **Ejecuta el script automático:**
   ```bash
   powershell -ExecutionPolicy Bypass -File quick-setup.ps1
   ```

2. **El script detectará automáticamente:**
   - Tu nueva IP
   - Actualizará la configuración
   - Regenerará certificados SSL si es necesario

3. **Relanza la aplicación:**
   ```bash
   npm run start -- --ssl --host 0.0.0.0
   ```

## 📋 **Comandos de Verificación**

### **Verificar IP actual:**
```bash
ipconfig | findstr "IPv4"
```

### **Verificar certificados SSL:**
```bash
dir ssl\
```

### **Verificar configuración:**
```bash
type src\environments\environment.ts
```

## 🎯 **Resumen de Comandos Principales**

```bash
# Configuración automática (cada vez que cambies de red)
powershell -ExecutionPolicy Bypass -File quick-setup.ps1

# Desarrollo con HTTPS
npm run start -- --ssl --host 0.0.0.0

# Producción con HTTPS
npm run build -- --configuration production
npm run start -- --ssl --host 0.0.0.0 --configuration production
```

## 📞 **Soporte**

Si tienes problemas:
1. Ejecuta `quick-setup.ps1` para reconfigurar automáticamente
2. Verifica que tu backend esté en HTTPS en puerto 30001
3. Asegúrate de usar siempre `--ssl` al lanzar la aplicación

---

**¡Tu aplicación QR está lista para funcionar en cualquier red local con configuración automática!** 🚀📱
