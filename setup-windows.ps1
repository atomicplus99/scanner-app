# Script automatico para Windows - Instala Nginx y despliega la aplicacion QR Lector App
# Uso: .\setup-windows.ps1

Write-Host "Configuracion automatica para Windows - QR Lector App..." -ForegroundColor Green

# Verificar si se ejecuta como administrador
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "Cierra PowerShell y ejecutalo como Administrador" -ForegroundColor Yellow
    pause
    exit
}

# Paso 1: Detectar IP y configurar environment
Write-Host "Paso 1: Detectando IP y configurando environment..." -ForegroundColor Cyan

# Obtener IP actual
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -and $_.IPAddress -ne "192.168.1.1"} | Select-Object -First 1).IPAddress

if (!$localIP) {
    Write-Host "No se pudo detectar tu IP automaticamente" -ForegroundColor Red
    Write-Host "Asegurate de estar conectado a una red WiFi" -ForegroundColor Yellow
    exit 1
}

Write-Host "IP detectada: $localIP" -ForegroundColor Green

# Actualizar environment.ts con IP detectada
Write-Host "Actualizando environment.ts..." -ForegroundColor Yellow
$envFile = "src\environments\environment.ts"

$fileContent = "export const environment = {`n  production: false,`n  apiUrl: 'https://" + $localIP + ":30001'`n};`n`nexport const environmentD = {`n  production: false,`n  apiUrlDev: 'https://" + $localIP + ":30001'`n};`n`nexport const environmentP = {`n  production: false,`n  apiUrlProd: 'https://" + $localIP + ":30001'`n};"

[System.IO.File]::WriteAllText($envFile, $fileContent, [System.Text.Encoding]::UTF8)
Write-Host "environment.ts actualizado con IP: $localIP (puerto 30001)" -ForegroundColor Green

# Generar certificados SSL
Write-Host "Generando certificados SSL..." -ForegroundColor Yellow

# Crear directorio ssl si no existe
if (!(Test-Path "ssl")) {
    New-Item -ItemType Directory -Path "ssl" -Force
    Write-Host "Directorio ssl creado" -ForegroundColor Green
}

# Generar certificado y clave usando OpenSSL
try {
    $opensslPath = Get-Command openssl -ErrorAction SilentlyContinue
    if ($opensslPath) {
        Write-Host "Generando certificados SSL con OpenSSL..." -ForegroundColor Green
        
        # Generar clave privada
        openssl genrsa -out "ssl\localhost.key" 2048
        
        # Generar certificado autofirmado
        openssl req -new -x509 -key "ssl\localhost.key" -out "ssl\localhost.crt" -days 365 -subj "/C=PE/ST=Lima/L=Lima/O=QR-Lector-App/OU=IT/CN=localhost" -addext "subjectAltName=DNS:localhost,DNS:127.0.0.1,IP:$localIP"
        
        Write-Host "Certificados SSL generados exitosamente" -ForegroundColor Green
    } else {
        Write-Host "OpenSSL no encontrado, generando certificados basicos..." -ForegroundColor Yellow
        
        # Generar certificados basicos como fallback
        $certContent = "-----BEGIN CERTIFICATE-----`nMIIDXTCCAkWgAwIBAgIJAKoK/heHhQwFMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV`nBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5l`ndCBXaWRnaXRzIFB0eSBMdGQwHhcNMjQwODExMDUxNjAwWhcNMjUwODExMDUx`nNjAwWjBFMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8G`nA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0B`nAQEFAAOCAQ8AMIIBCgKCAQEAu1SU1LfVLPHCs8zMxH2Mo4lgOEePzNm0tRge`nLezV6ffAt0gunVTLw7onLRnrq0/IzW7yWR7QkrmBL7jTKEn5u+qKqhcyMtEP/`nbs8dEt1cS0MSfAd5Ycx3Ao0X0B4yX+hny/Y+QxPkcC8IeqbE77XEUxHx/lq7Q`ndYvH9Ig9zPy3ps/HZZNDvVzcMTOkLvS5uXcMRO6OqjHi96ZFDRRaWG7CmnNXv`nXjqK+dWu8ItSW65tswtHAPPNMPgLyqSrdHpzPlkuVNblorU6eVf8gTOm9rY5`n15ZYzIlVSY5crSxo+CG6+Ko0ufW16JuS69IQIfLCXywIDAQABo1AwTjAdBgNV`nHQ4EFgQUQKxP1woRaB+prbKf8nXzXck3QswHwYDVR0jBBgwFoAUQKxP1woR`naB+prbKf8nXzXck3QswDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOC`nAQEAeAh+1cKbmn3D5tqkydQrnp0LzVZUVyThCRgM5tSJaJM12voCNqP6jJ5`n-----END CERTIFICATE-----"
        
        [System.IO.File]::WriteAllText("ssl\localhost.crt", $certContent, [System.Text.Encoding]::ASCII)
        
        $privateKey = "-----BEGIN PRIVATE KEY-----`nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKz`nMzEfYyjiWA4R4/M2bS1GB4t7NXp98C3SC6dVMvDuictGeurT8jNbvJZHtCSuYEvuNMoSfm76o`nqFzAy0Q/9uyx0S3VxLQxJ8B3lhzHcCjRfQHjJf6GfL9j5DE+RwLwh6psTvtcRTEfH+W`nrtB1i8f0iD3M/Lemz8dlk0O9XNwxM6Qu9Lm5dwxE7o6qMeL3pkUPNFpYbsKac1e`n9eOor51a7wi1Jbrm2zC0cA480w+AvKpKt0enM+WS5U1uWitTp5V/yBM6b2tjl`nXhljMiVVJjlytLGj4Ibr4qjS59bXom5Lr0hAh8sJfLAgMBAAECggEBAKTmjaS6`nkKdhXjuf9AXjK1aGDk4QdfgUBP9jfT0Q/JZsGtU+J2e/ezf2CzF31Q4D8fHr`n6n9NuuD0j5DsVM+3J4mJbhFMAqB0yfgtMlM6o8eEpH2eMoFx1KEzIAn2`n7nKbsdjlC+iVf5KJfXihw0MxJxPYR0Gbrk0ZVRUfE+8L95LydJEV3CLi`nUZvsDLRkqBwQnS+w9WmcdLREqRuzCuoj9SqFdX1KmhP6V7+GLfyl1FNa`nD4i3Cj4tvTt1coY8iRyYzrWlVLn2tPd6M5rY6NNSnVfB6mq8X4RhsMZ`nXo1Xe9PynJp3S2dQNxPZ+OZXbwJg0X3LFLFLMvFoVN8n`n-----END PRIVATE KEY-----"
        
        [System.IO.File]::WriteAllText("ssl\localhost.key", $privateKey, [System.Text.Encoding]::ASCII)
        
        Write-Host "Certificados SSL basicos generados" -ForegroundColor Green
    }
} catch {
    Write-Host "ERROR generando certificados: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Paso 2: Construir la aplicacion
Write-Host "Paso 2: Construyendo aplicacion Angular..." -ForegroundColor Cyan
npm run build:prod

# Paso 3: Descargar e instalar Nginx
Write-Host "Paso 3: Descargando Nginx..." -ForegroundColor Cyan
$nginxDir = "C:\nginx"
$nginxUrl = "http://nginx.org/download/nginx-1.24.0.zip"
$zipPath = "$env:TEMP\nginx.zip"

# Crear directorio
if (!(Test-Path $nginxDir)) {
    New-Item -ItemType Directory -Path $nginxDir -Force
}

# Descargar Nginx
Invoke-WebRequest -Uri $nginxUrl -OutFile $zipPath
Write-Host "Nginx descargado" -ForegroundColor Green

# Extraer archivos
Write-Host "Extrayendo Nginx..." -ForegroundColor Cyan
Expand-Archive -Path $zipPath -DestinationPath $nginxDir -Force

# Mover archivos de la subcarpeta
$subDir = Get-ChildItem -Path $nginxDir -Directory | Where-Object { $_.Name -like "nginx-*" } | Select-Object -First 1
if ($subDir) {
    Get-ChildItem -Path $subDir.FullName | Move-Item -Destination $nginxDir -Force
    Remove-Item $subDir.FullName -Force
}

# Crear directorios necesarios
New-Item -ItemType Directory -Path "$nginxDir\logs" -Force
New-Item -ItemType Directory -Path "$nginxDir\conf" -Force
New-Item -ItemType Directory -Path "$nginxDir\ssl" -Force
New-Item -ItemType Directory -Path "$nginxDir\dist" -Force

# Paso 4: Crear configuracion de Nginx
Write-Host "Paso 4: Configurando Nginx..." -ForegroundColor Cyan

# Obtener IP actual para la configuracion (SIEMPRE detectar, NUNCA hardcodear)
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -and $_.IPAddress -ne "192.168.1.1"} | Select-Object -First 1).IPAddress

# Verificar que se detectó la IP
if (!$localIP) {
    Write-Host "ERROR: No se pudo detectar tu IP automaticamente" -ForegroundColor Red
    Write-Host "Asegurate de estar conectado a una red WiFi" -ForegroundColor Yellow
    exit 1
}

Write-Host "IP detectada para Nginx: $localIP" -ForegroundColor Green
Write-Host "DEBUG: Tipo de variable localIP: $($localIP.GetType().Name)" -ForegroundColor Yellow
Write-Host "DEBUG: Valor exacto de localIP: '$localIP'" -ForegroundColor Yellow

# Crear mime.types basico
$mimeTypes = @"
types {
    text/html html htm shtml;
    text/css css;
    text/xml xml;
    image/gif gif;
    image/jpeg jpeg jpg;
    application/javascript js;
    image/png png;
    image/svg+xml svg svgz;
    application/font-woff woff;
    application/font-woff2 woff2;
    application/json json;
}
"@

Set-Content -Path "$nginxDir\conf\mime.types" -Value $mimeTypes -Encoding ASCII

# Crear nginx.conf con IP detectada y HTTPS usando concatenacion de strings
$nginxConfig = "worker_processes 1;`n`n" +
"events {`n" +
"    worker_connections 1024;`n" +
"}`n`n" +
"http {`n" +
"    include mime.types;`n" +
"    default_type application/octet-stream;`n`n" +
"    access_log logs/access.log;`n" +
"    error_log logs/error.log;`n`n" +
"    gzip on;`n" +
"    gzip_types text/plain text/css text/javascript application/javascript application/json;`n`n" +
"    # Servidor HTTP (redirige a HTTPS)`n" +
"    server {`n" +
"        listen 80;`n" +
"        server_name localhost;`n" +
"        return 301 https://`$server_name`$request_uri;`n" +
"    }`n`n" +
"    # Servidor HTTPS principal`n" +
"    server {`n" +
"        listen 443 ssl;`n" +
"        server_name localhost;`n`n" +
"        # Certificados SSL`n" +
"        ssl_certificate ../ssl/localhost.crt;`n" +
"        ssl_certificate_key ../ssl/localhost.key;`n`n" +
"        # Configuracion SSL`n" +
"        ssl_protocols TLSv1.2 TLSv1.3;`n" +
"        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;`n" +
"        ssl_prefer_server_ciphers off;`n`n" +
"        location / {`n" +
"            root dist/qr-lector-app-andres-huaral/browser;`n" +
"            try_files `$uri `$uri/ /index.html;`n`n" +
"            add_header X-Frame-Options `"SAMEORIGIN`" always;`n" +
"            add_header X-Content-Type-Options `"nosniff`" always;`n" +
"            add_header X-XSS-Protection `"1; mode=block`" always;`n" +
"        }`n`n" +
"        location /api/ {`n" +
"            proxy_pass https://" + $localIP + ":30001/;`n" +
"            # NOTA: $localIP se detecta automaticamente, NUNCA se hardcodea`n" +
"            proxy_set_header Host `$host;`n" +
"            proxy_set_header X-Real-IP `$remote_addr;`n" +
"            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;`n" +
"            proxy_set_header X-Forwarded-Proto https;`n" +
"        }`n`n" +
"        location /asistencia/ {`n" +
"            proxy_pass https://" + $localIP + ":30001/asistencia/;`n" +
"            # NOTA: $localIP se detecta automaticamente, NUNCA se hardcodea`n" +
"            proxy_set_header Host `$host;`n" +
"            proxy_set_header X-Real-IP `$remote_addr;`n" +
"            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;`n" +
"            proxy_set_header X-Forwarded-Proto https;`n" +
"        }`n`n" +
"        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {`n" +
"            root dist/qr-lector-app-andres-huaral/browser;`n" +
"            expires 1y;`n" +
"        }`n`n" +
"        error_page 404 /index.html;`n" +
"    }`n" +
"}"

Set-Content -Path "$nginxDir\conf\nginx.conf" -Value $nginxConfig -Encoding ASCII

# Verificar que la configuracion use la IP detectada correctamente
Write-Host "Verificando configuración de IP..." -ForegroundColor Yellow
$configContent = Get-Content "$nginxDir\conf\nginx.conf" -Raw

# Verificar que la IP detectada esté en la configuración
if ($configContent -notmatch [regex]::Escape($localIP)) {
    Write-Host "ERROR: La IP detectada ($localIP) no está en la configuración!" -ForegroundColor Red
    Write-Host "Esto indica un problema de interpolación de variables" -ForegroundColor Yellow
    exit 1
}

# Verificar que NO haya IPs hardcodeadas de ejecuciones anteriores
if ($configContent -match "192\.168\.\d+\.\d+" -and $configContent -notmatch [regex]::Escape($localIP)) {
    Write-Host "ERROR: Se detectó IP hardcodeada de ejecución anterior!" -ForegroundColor Red
    Write-Host "La configuración debe usar solo la IP actual: $localIP" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Configuración correcta - IP detectada: $localIP" -ForegroundColor Green

# Paso 5: Copiar archivos de la aplicacion y certificados SSL
Write-Host "Paso 5: Copiando archivos de la aplicacion y certificados SSL..." -ForegroundColor Cyan
Copy-Item "dist\*" "$nginxDir\dist\" -Recurse -Force

# Copiar certificados SSL
if (Test-Path "ssl") {
    Write-Host "Copiando certificados SSL..." -ForegroundColor Yellow
    
    # Verificar que el directorio de destino existe
    if (!(Test-Path "$nginxDir\ssl")) {
        New-Item -ItemType Directory -Path "$nginxDir\ssl" -Force
        Write-Host "Directorio $nginxDir\ssl creado" -ForegroundColor Green
    }
    
    # Copiar certificados con verificacion
    try {
        Copy-Item "ssl\*" "$nginxDir\ssl\" -Recurse -Force
        Write-Host "Certificados SSL copiados a $nginxDir\ssl\" -ForegroundColor Green
        
        # Verificar que se copiaron correctamente
        $sslFiles = Get-ChildItem "$nginxDir\ssl" -ErrorAction SilentlyContinue
        if ($sslFiles) {
            Write-Host "Archivos SSL encontrados en $nginxDir\ssl:" -ForegroundColor Green
            $sslFiles | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor White }
        } else {
            Write-Host "ERROR: No se encontraron archivos SSL en $nginxDir\ssl" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "ERROR copiando certificados SSL: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "ADVERTENCIA: No se encontraron certificados SSL en la carpeta 'ssl'" -ForegroundColor Red
    Write-Host "La aplicacion funcionara solo en HTTP (puerto 80)" -ForegroundColor Yellow
}

# Paso 6: Crear scripts de control
Write-Host "Paso 6: Creando scripts de control..." -ForegroundColor Cyan

$startScript = @"
@echo off
cd /d $nginxDir
start nginx.exe
echo Nginx iniciado en http://localhost
pause
"@

Set-Content -Path "start-nginx.bat" -Value $startScript -Encoding ASCII

$stopScript = @"
@echo off
cd /d $nginxDir
taskkill /f /im nginx.exe
echo Nginx detenido
pause
"@

Set-Content -Path "stop-nginx.bat" -Value $stopScript -Encoding ASCII

$restartScript = @"
@echo off
cd /d $nginxDir
taskkill /f /im nginx.exe
timeout /t 2 /nobreak >nul
start nginx.exe
echo Nginx reiniciado
pause
"@

Set-Content -Path "restart-nginx.bat" -Value $restartScript -Encoding ASCII

# Paso 7: Probar configuracion
Write-Host "Paso 7: Probando configuracion..." -ForegroundColor Cyan
Set-Location $nginxDir
$testResult = .\nginx.exe -t 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Configuracion valida" -ForegroundColor Green
    
    # Paso 8: Iniciar Nginx
    Write-Host "Paso 8: Iniciando Nginx..." -ForegroundColor Cyan
    Start-Process -FilePath ".\nginx.exe"
    
    # Limpiar archivo temporal
    Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    
    Write-Host ""
    Write-Host "CONFIGURACION COMPLETADA EXITOSAMENTE!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tu aplicacion QR Lector App esta disponible en:" -ForegroundColor Cyan
    Write-Host "  https://localhost" -ForegroundColor White
    Write-Host "  https://$localIP" -ForegroundColor White
    Write-Host "  (HTTP redirige automaticamente a HTTPS)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Backend configurado en: https://$localIP:30001" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Comandos disponibles:" -ForegroundColor Cyan
    Write-Host "  start-nginx.bat     - Iniciar Nginx" -ForegroundColor White
    Write-Host "  stop-nginx.bat      - Detener Nginx" -ForegroundColor White
    Write-Host "  restart-nginx.bat   - Reiniciar Nginx" -ForegroundColor White
    Write-Host ""
    Write-Host "Nginx se inicio automaticamente" -ForegroundColor Green
    
} else {
    Write-Host "Error en la configuracion:" -ForegroundColor Red
    Write-Host $testResult -ForegroundColor Red
}

pause
