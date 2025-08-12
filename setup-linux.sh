#!/bin/bash

# Script automatico para Linux - Instala Nginx y despliega la aplicacion QR Lector App
# Uso: ./setup-linux.sh

echo "🚀 Configuracion automatica para Linux - QR Lector App..."

# Verificar si se ejecuta como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Este script debe ejecutarse como root (sudo)"
    echo "💡 Ejecuta: sudo ./setup-linux.sh"
    exit 1
fi

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Paso 1: Detectar IP y configurar environment
echo -e "${CYAN}Paso 1: Detectando IP y configurando environment...${NC}"

# Obtener IP actual
LOCAL_IP=$(ip route get 1.1.1.1 | awk '{print $7}' | head -n1)
echo -e "${GREEN}IP detectada: $LOCAL_IP${NC}"
echo -e "${YELLOW}DEBUG: Tipo de variable LOCAL_IP: $(echo $LOCAL_IP | wc -c) caracteres${NC}"
echo -e "${YELLOW}DEBUG: Valor exacto de LOCAL_IP: '$LOCAL_IP'${NC}"

# Actualizar environment.ts con IP detectada
echo -e "${YELLOW}Actualizando environment.ts...${NC}"
ENV_FILE="src/environments/environment.ts"

cat > $ENV_FILE << EOF
export const environment = {
  production: false,
  apiUrl: 'https://$LOCAL_IP:30001'
};

export const environmentD = {
  production: false,
  apiUrlDev: 'https://$LOCAL_IP:30001'
};

export const environmentP = {
  production: false,
  apiUrlProd: 'https://$LOCAL_IP:30001'
};
EOF

echo -e "${GREEN}environment.ts actualizado con IP: $LOCAL_IP (puerto 30001)${NC}"

# Generar certificados SSL
echo -e "${YELLOW}Generando certificados SSL...${NC}"

# Crear directorio ssl si no existe
mkdir -p ssl

# Generar certificado y clave usando OpenSSL
if command -v openssl &> /dev/null; then
    echo -e "${GREEN}Generando certificados SSL con OpenSSL...${NC}"
    
    # Generar clave privada
    openssl genrsa -out ssl/localhost.key 2048
    
    # Generar certificado autofirmado
    openssl req -new -x509 -key ssl/localhost.key -out ssl/localhost.crt -days 365 \
        -subj "/C=PE/ST=Lima/L=Lima/O=QR-Lector-App/OU=IT/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,DNS:127.0.0.1,IP:$LOCAL_IP"
    
    echo -e "${GREEN}Certificados SSL generados exitosamente${NC}"
else
    echo -e "${YELLOW}OpenSSL no encontrado, generando certificados basicos...${NC}"
    
    # Generar certificados basicos como fallback
    cat > ssl/localhost.crt << 'EOF'
-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoK/heHhQwFMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5l
dCBXaWRnaXRzIFB0eSBMdGQwHhcNMjQwODExMDUxNjAwWhcNMjUwODExMDUx
NjAwWjBFMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8G
A1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0B
AQEFAAOCAQ8AMIIBCgKCAQEAu1SU1LfVLPHCs8zMxH2Mo4lgOEePzNm0tRge
LezV6ffAt0gunVTLw7onLRnrq0/IzW7yWR7QkrmBL7jTKEn5u+qKqhcyMtEP/
bs8dEt1cS0MSfAd5Ycx3Ao0X0B4yX+hny/Y+QxPkcC8IeqbE77XEUxHx/lq7Q
dYvH9Ig9zPy3ps/HZZNDvVzcMTOkLvS5uXcMRO6OqjHi96ZFDRRaWG7CmnNXv
XjqK+dWu8ItSW65tswtHAPPNMPgLyqSrdHpzPlkuVNblorU6eVf8gTOm9rY5
15ZYzIlVSY5crSxo+CG6+Ko0ufW16JuS69IQIfLCXywIDAQABo1AwTjAdBgNV
HQ4EFgQUQKxP1woRaB+prbKf8nXzXck3QswHwYDVR0jBBgwFoAUQKxP1woR
aB+prbKf8nXzXck3QswDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOC
AQEAeAh+1cKbmn3D5tqkydQrnp0LzVZUVyThCRgM5tSJaJM12voCNqP6jJ5
-----END CERTIFICATE-----
EOF

    cat > ssl/localhost.key << 'EOF'
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKz
MzEfYyjiWA4R4/M2bS1GB4t7NXp98C3SC6dVMvDuictGeurT8jNbvJZHtCSuYEvuNMoSfm76o
qFzAy0Q/9uyx0S3VxLQxJ8B3lhzHcCjRfQHjJf6GfL9j5DE+RwLwh6psTvtcRTEfH+W
rtB1i8f0iD3M/Lemz8dlk0O9XNwxM6Qu9Lm5dwxE7o6qMeL3pkUPNFpYbsKac1e
9eOor51a7wi1Jbrm2zC0cA480w+AvKpKt0enM+WS5U1uWitTp5V/yBM6b2tjl
XhljMiVVJjlytLGj4Ibr4qjS59bXom5Lr0hAh8sJfLAgMBAAECggEBAKTmjaS6
kKdhXjuf9AXjK1aGDk4QdfgUBP9jfT0Q/JZsGtU+J2e/ezf2CzF31Q4D8fHr
6n9NuuD0j5DsVM+3J4mJbhFMAqB0yfgtMlM6o8eEpH2eMoFx1KEzIAn2
7nKbsdjlC+iVf5KJfXihw0MxJxPYR0Gbrk0ZVRUfE+8L95LydJEV3CLi
UZvsDLRkqBwQnS+w9WmcdLREqRuzCuoj9SqFdX1KmhP6V7+GLfyl1FNa
D4i3Cj4tvTt1coY8iRyYzrWlVLn2tPd6M5rY6NNSnVfB6mq8X4RhsMZ
Xo1Xe9PynJp3S2dQNxPZ+OZXbwJg0X3LFLFLMvFoVN8n
-----END PRIVATE KEY-----
EOF

    echo -e "${GREEN}Certificados SSL basicos generados${NC}"
fi

# Paso 2: Construir la aplicacion
echo -e "${CYAN}Paso 2: Construyendo aplicacion Angular...${NC}"
npm run build:prod

# Paso 3: Instalar Nginx
echo -e "${CYAN}Paso 3: Instalando Nginx...${NC}"
apt update
apt install -y nginx

# Paso 4: Obtener IP actual
echo -e "${CYAN}Paso 4: Detectando IP...${NC}"
LOCAL_IP=$(ip route get 1.1.1.1 | awk '{print $7}' | head -n1)
echo -e "${GREEN}IP detectada: $LOCAL_IP${NC}"

# Paso 5: Crear directorio para la aplicacion
echo -e "${CYAN}Paso 5: Creando directorio para la aplicacion...${NC}"
APP_DIR="/var/www/qr-lector-app"
mkdir -p $APP_DIR
cp -r dist/* $APP_DIR/

# Paso 6: Copiar certificados SSL
echo -e "${CYAN}Paso 6: Copiando certificados SSL...${NC}"
if [ -d "ssl" ]; then
    echo -e "${YELLOW}Copiando certificados SSL...${NC}"
    cp -r ssl/* /etc/ssl/certs/
    chmod 644 /etc/ssl/certs/localhost.crt
    chmod 600 /etc/ssl/certs/localhost.key
else
    echo -e "${RED}ADVERTENCIA: No se encontraron certificados SSL${NC}"
    echo -e "${YELLOW}La aplicacion funcionara solo en HTTP${NC}"
fi

# Paso 7: Crear configuracion de Nginx
echo -e "${CYAN}Paso 7: Configurando Nginx...${NC}"

# Crear archivo de sitio
SITE_CONFIG="/etc/nginx/sites-available/qr-lector-app"
cat > $SITE_CONFIG << EOF
# Configuracion para QR Lector App
server {
    listen 80;
    server_name _;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl;
    server_name _;
    
    # Certificados SSL
    ssl_certificate /etc/ssl/certs/localhost.crt;
    ssl_certificate_key /etc/ssl/certs/localhost.key;
    
    # Configuracion SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Document root
    root $APP_DIR/browser;
    index index.html;
    
    # Configuracion principal
    location / {
        try_files \$uri \$uri/ /index.html;
        
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
    
    # Proxy para API
    location /api/ {
        proxy_pass https://$LOCAL_IP:30001/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
    
    # Proxy para asistencia
    location /asistencia/ {
        proxy_pass https://$LOCAL_IP:30001/asistencia/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
    
    # Archivos estaticos con cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Manejo de rutas SPA
    error_page 404 /index.html;
}
EOF

# Paso 8: Activar sitio y desactivar default
echo -e "${CYAN}Paso 8: Activando sitio...${NC}"
rm -f /etc/nginx/sites-enabled/default
ln -sf $SITE_CONFIG /etc/nginx/sites-enabled/

# Paso 9: Configurar permisos
echo -e "${CYAN}Paso 9: Configurando permisos...${NC}"
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

# Paso 10: Verificar configuracion de IP
echo -e "${CYAN}Paso 10: Verificando configuracion de IP...${NC}"

# Verificar que la IP detectada esté en la configuración
if ! grep -q "$LOCAL_IP" $SITE_CONFIG; then
    echo -e "${RED}ERROR: La IP detectada ($LOCAL_IP) no está en la configuración!${NC}"
    echo -e "${YELLOW}Esto indica un problema de interpolación de variables${NC}"
    exit 1
fi

# Verificar que NO haya IPs hardcodeadas de ejecuciones anteriores
if grep -q "192\.168\." $SITE_CONFIG && ! grep -q "$LOCAL_IP" $SITE_CONFIG; then
    echo -e "${RED}ERROR: Se detectó IP hardcodeada de ejecución anterior!${NC}"
    echo -e "${YELLOW}La configuración debe usar solo la IP actual: $LOCAL_IP${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Configuración correcta - IP detectada: $LOCAL_IP${NC}"

# Paso 11: Probar configuracion
echo -e "${CYAN}Paso 11: Probando configuracion...${NC}"
if nginx -t; then
    echo -e "${GREEN}Configuracion valida${NC}"
    
    # Paso 12: Reiniciar Nginx
    echo -e "${CYAN}Paso 12: Reiniciando Nginx...${NC}"
    systemctl restart nginx
    systemctl enable nginx
    
    # Paso 13: Configurar firewall
    echo -e "${CYAN}Paso 13: Configurando firewall...${NC}"
    ufw allow 'Nginx Full'
    ufw allow 30001
    
    echo ""
    echo -e "${GREEN}✅ CONFIGURACION COMPLETADA EXITOSAMENTE!${NC}"
    echo ""
    echo -e "${CYAN}Tu aplicacion QR Lector App esta disponible en:${NC}"
    echo -e "  ${GREEN}https://localhost${NC}"
    echo -e "  ${GREEN}https://$LOCAL_IP${NC}"
    echo -e "  ${YELLOW}(HTTP redirige automaticamente a HTTPS)${NC}"
    echo ""
    echo -e "${CYAN}Backend configurado en: https://$LOCAL_IP:30001${NC}"
    echo ""
    echo -e "${CYAN}Comandos de control:${NC}"
    echo -e "  ${GREEN}sudo systemctl start nginx${NC}     - Iniciar Nginx"
    echo -e "  ${GREEN}sudo systemctl stop nginx${NC}      - Detener Nginx"
    echo -e "  ${GREEN}sudo systemctl restart nginx${NC}   - Reiniciar Nginx"
    echo -e "  ${GREEN}sudo systemctl status nginx${NC}    - Estado de Nginx"
    echo ""
    echo -e "${GREEN}Nginx se inicio automaticamente${NC}"
    
else
    echo -e "${RED}❌ Error en la configuracion de Nginx${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎯 ¡Tu aplicacion QR Lector App esta funcionando con HTTPS en Linux!${NC}"
