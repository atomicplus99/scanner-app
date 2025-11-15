# app scanner - andres huaral

aplicacion para registrar asistencia con codigos qr, esta configurada para usar https

## requisitos

- node.js 18+ 
- npm 
- angular cli


## instalacion

```bash
# clonar repo
git clone https://github.com/atomicplus99/qr-lector-app-andres-huaral.git
cd qr-lector-app-andres-huaral

# instalar todo
npm install

# si no tienes angular cli
npm install -g @angular/cli
```

## configurar para tu red

### paso 1: configurar el environment

**forma manual:**

1. copiar el archivo:
```bash
cp src/environments/environment.example.ts src/environments/environment.ts
```

2. editar `environment.ts` y poner tu ip:
```typescript
apiUrl: 'https://192.168.1.108:30001'  // poner tu ip aqui
```

**forma automatica (windows):**

```bash
powershell -ExecutionPolicy Bypass -File quick-setup.ps1
```

el script hace:
- detecta tu ip 
- actualiza environment.ts 
- genera certificados ssl 


### paso 2: correr en desarrollo

```bash
npm run start -- --ssl --host 0.0.0.0
```


### paso 3: correr en produccion

```bash
# hacer build
npm run build -- --configuration production

# correr con https
npm run start -- --ssl --host 0.0.0.0 --configuration production
```


## configurar backend

importante: el backend tiene que estar en https en el puerto 30001

para verificar que funciona abre: `https://TU_IP:30001` en el navegador

## deploy con nginx

### windows 

```bash
# correr como administrador
powershell -ExecutionPolicy Bypass -File setup-windows.ps1
```

esto hace:
- detecta tu ip
- genera certificados ssl
- hace build de angular
- instala nginx
- configura nginx con https
- inicia nginx

### linux

```bash
# dar permisos
chmod +x setup-linux.sh

# correr como root
sudo ./setup-linux.sh
```

esto hace:
- detecta tu ip
- genera ssl
- instala nginx
- configura nginx 
- configura firewall
- inicia nginx

### si quieres configurar nginx manual

los archivos quedan en:
- linux: `/etc/nginx/sites-available/qr-lector-app`
- windows: `C:\nginx\conf\nginx.conf`

caracteristicas:
- https obligatorio, http redirige a https
- proxy al backend en `/api/` y `/asistencia/`
- maneja rutas de angular
- usa certificados ssl

### urls cuando usas nginx

- frontend: `https://TU_IP` 
- backend: `https://TU_IP:30001` 

### controlar nginx

**windows:**
```bash
start-nginx.bat     # iniciar
stop-nginx.bat      # parar
restart-nginx.bat   # reiniciar
```

**linux:**
```bash
sudo systemctl start nginx      
sudo systemctl stop nginx       
sudo systemctl restart nginx    
sudo systemctl status nginx     
```

## que tiene la app

- https para poder usar camara
- funciona en red local
- script detecta ip automaticamente
- genera certificados ssl
- funciona en dev y prod
- nginx configurado automatico
- proxy al backend en puerto 30001
- no usa ips hardcoded

## problemas comunes

### error mixed content
- causa: frontend https intenta conectar a backend http
- solucion: backend tiene que estar en https puerto 30001

### camara no funciona
- causa: no estas usando https
- solucion: siempre usar `--ssl` 

### no se conecta desde celular
- causa: ip mal o firewall
- solucion: correr `quick-setup.ps1` 

### error 404 
- causa: rutas del backend no coinciden
- solucion: revisar que backend tenga `/asistencia/scan`

## si cambias de wifi

1. correr:
```bash
powershell -ExecutionPolicy Bypass -File quick-setup.ps1
```

2. el script detecta:
   - nueva ip
   - actualiza config
   - regenera ssl si hace falta

3. volver a correr:
```bash
npm run start -- --ssl --host 0.0.0.0
```

## verificar cosas

### ver tu ip:
```bash
ipconfig | findstr "IPv4"
```

### ver certificados:
```bash
dir ssl\
```

### ver config:
```bash
type src\environments\environment.ts
```

## comandos principales

```bash
# setup automatico
powershell -ExecutionPolicy Bypass -File quick-setup.ps1

# desarrollo
npm run start -- --ssl --host 0.0.0.0

# produccion
npm run build -- --configuration production
npm run start -- --ssl --host 0.0.0.0 --configuration production
```

## si algo no funciona

1. correr `quick-setup.ps1` 
2. revisar que backend este en https puerto 30001
3. usar siempre `--ssl` 

---

listo, la app funciona en cualquier red local
