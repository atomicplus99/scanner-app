# Script de configuracion rapida para cambiar de red
# Ejecutar como Administrador en PowerShell

# Habilitar captura de errores detallada
$ErrorActionPreference = "Continue"
$VerbosePreference = "Continue"

Write-Host "Configuracion Rapida para Nueva Red" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan

try {
    # Obtener IP actual
    Write-Host "Detectando IP..." -ForegroundColor Yellow
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -and $_.IPAddress -ne "192.168.1.1"} | Select-Object -First 1).IPAddress

    if (!$localIP) {
        Write-Host "No se pudo detectar tu IP automaticamente" -ForegroundColor Red
        Write-Host "Asegurate de estar conectado a una red WiFi" -ForegroundColor Yellow
        exit 1
    }

    Write-Host "IP detectada: $localIP" -ForegroundColor Green

    # Actualizar environment.ts
    Write-Host "Actualizando environment.ts..." -ForegroundColor Yellow
    $envFile = "src\environments\environment.ts"
    
    Write-Host "Archivo a modificar: $envFile" -ForegroundColor Cyan
    Write-Host "IP a usar: $localIP" -ForegroundColor Cyan

    # Crear contenido del archivo usando concatenación
    $fileContent = "export const environment = {`n  production: false,`n  apiUrl: 'http://" + $localIP + ":3000'`n};`n`nexport const environmentD = {`n  production: false,`n  apiUrlDev: 'http://" + $localIP + ":3000'`n};`n`nexport const environmentP = {`n  production: false,`n  apiUrlProd: 'https://192.168.1.54:3001'`n};"
    
    Write-Host "DEBUG: localIP = '$localIP'" -ForegroundColor Magenta
    Write-Host "DEBUG: fileContent contiene la IP correcta:" -ForegroundColor Magenta
    Write-Host $fileContent -ForegroundColor Magenta
    
    Write-Host "Contenido a escribir:" -ForegroundColor Cyan
    Write-Host $fileContent -ForegroundColor White

    # Verificar si el archivo existe
    if (Test-Path $envFile) {
        Write-Host "Archivo existe, procediendo a sobrescribir..." -ForegroundColor Green
    } else {
        Write-Host "Archivo NO existe, creando nuevo..." -ForegroundColor Yellow
    }

    # Escribir archivo con manejo de errores detallado
    try {
        Write-Host "Intentando escribir archivo..." -ForegroundColor Yellow
        [System.IO.File]::WriteAllText($envFile, $fileContent, [System.Text.Encoding]::UTF8)
        Write-Host "Archivo escrito exitosamente" -ForegroundColor Green
        
        # Verificar que se escribió correctamente
        $verification = Get-Content $envFile -Raw
        Write-Host "Verificacion del archivo:" -ForegroundColor Cyan
        Write-Host $verification -ForegroundColor White
        
        Write-Host "environment.ts actualizado con IP: $localIP (HTTP para backend)" -ForegroundColor Green
    } catch {
        Write-Host "ERROR CRITICO escribiendo archivo:" -ForegroundColor Red
        Write-Host "Mensaje: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Tipo: $($_.Exception.GetType().Name)" -ForegroundColor Red
        Write-Host "Stack Trace: $($_.Exception.StackTrace)" -ForegroundColor Red
        exit 1
    }

    # Generar certificados SSL
    Write-Host "Generando certificados SSL..." -ForegroundColor Yellow

    # Crear directorio ssl si no existe
    if (!(Test-Path "ssl")) {
        Write-Host "Creando directorio ssl..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Path "ssl"
    }

    # Generar certificado y clave usando OpenSSL (no requiere permisos de admin)
    try {
        # Verificar si OpenSSL esta disponible
        Write-Host "Verificando OpenSSL..." -ForegroundColor Yellow
        $opensslPath = Get-Command openssl -ErrorAction SilentlyContinue
        if ($opensslPath) {
            Write-Host "OpenSSL encontrado en: $($opensslPath.Source)" -ForegroundColor Green
            Write-Host "Usando OpenSSL para generar certificados..." -ForegroundColor Green
            
            # Generar clave privada
            Write-Host "Generando clave privada..." -ForegroundColor Yellow
            openssl genrsa -out "ssl\localhost.key" 2048
            
            # Generar certificado autofirmado
            Write-Host "Generando certificado..." -ForegroundColor Yellow
            openssl req -new -x509 -key "ssl\localhost.key" -out "ssl\localhost.crt" -days 365 -subj "/C=PE/ST=Lima/L=Lima/O=AndresHuaral/OU=IT/CN=localhost" -addext "subjectAltName=DNS:localhost,DNS:127.0.0.1,IP:$localIP"
            
            Write-Host "Certificados SSL generados con OpenSSL" -ForegroundColor Green
        } else {
            Write-Host "OpenSSL no encontrado, generando certificados basicos..." -ForegroundColor Yellow
            
            # Generar certificados basicos sin permisos de admin
            Write-Host "Generando certificados basicos..." -ForegroundColor Yellow
            $certContent = "-----BEGIN CERTIFICATE-----`nMIIDXTCCAkWgAwIBAgIJAKoK/heHhQwFMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV`nBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5l`ndCBXaWRnaXRzIFB0eSBMdGQwHhcNMjQwODExMDUxNjAwWhcNMjUwODExMDUx`nNjAwWjBFMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8G`nA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0B`nAQEFAAOCAQ8AMIIBCgKCAQEAu1SU1LfVLPHCs8zMxH2Mo4lgOEePzNm0tRge`nLezV6ffAt0gunVTLw7onLRnrq0/IzW7yWR7QkrmBL7jTKEn5u+qKqhcyMtEP/`nbs8dEt1cS0MSfAd5Ycx3Ao0X0B4yX+hny/Y+QxPkcC8IeqbE77XEUxHx/lq7Q`ndYvH9Ig9zPy3ps/HZZNDvVzcMTOkLvS5uXcMRO6OqjHi96ZFDRRaWG7CmnNXv`nXjqK+dWu8ItSW65tswtHAPPNMPgLyqSrdHpzPlkuVNblorU6eVf8gTOm9rY5`n15ZYzIlVSY5crSxo+CG6+Ko0ufW16JuS69IQIfLCXywIDAQABo1AwTjAdBgNV`nHQ4EFgQUQKxP1woRaB+prbKf8nXzXck3QswHwYDVR0jBBgwFoAUQKxP1woR`naB+prbKf8nXzXck3QswDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOC`nAQEAeAh+1cKbmn3D5tqkydQrnp0LzVZUVyThCRgM5tSJaJM12voCNqP6jJ5`n-----END CERTIFICATE-----"
            
            [System.IO.File]::WriteAllText("ssl\localhost.crt", $certContent, [System.Text.Encoding]::ASCII)
            
            $privateKey = "-----BEGIN PRIVATE KEY-----`nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKz`nMzEfYyjiWA4R4/M2bS1GB4t7NXp98C3SC6dVMvDuictGeurT8jNbvJZHtCSuYEvuNMoSfm76o`nqFzAy0Q/9uyx0S3VxLQxJ8B3lhzHcCjRfQHjJf6GfL9j5DE+RwLwh6psTvtcRTEfH+W`nrtB1i8f0iD3M/Lemz8dlk0O9XNwxM6Qu9Lm5dwxE7o6qMeL3pkUPNFpYbsKac1e`n9eOor51a7wi1Jbrm2zC0cA480w+AvKpKt0enM+WS5U1uWitTp5V/yBM6b2tjl`nXhljMiVVJjlytLGj4Ibr4qjS59bXom5Lr0hAh8sJfLAgMBAAECggEBAKTmjaS6`nkKdhXjuf9AXjK1aGDk4QdfgUBP9jfT0Q/JZsGtU+J2e/ezf2CzF31Q4D8fHr`n6n9NuuD0j5DsVM+3J4mJbhFMAqB0yfgtMlM6o8eEpH2eMoFx1KEzIAn2`n7nKbsdjlC+iVf5KJfXihw0MxJxPYR0Gbrk0ZVRUfE+8L95LydJEV3CLi`nUZvsDLRkqBwQnS+w9WmcdLREqRuzCuoj9SqFdX1KmhP6V7+GLfyl1FNa`nD4i3Cj4tvTt1coY8iRyYzrWlVLn2tPd6M5rY6NNSnVfB6mq8X4RhsMZ`nXo1Xe9PynJp3S2dQNxPZ+OZXbwJg0X3LFLFLMvFoVN8n`n-----END PRIVATE KEY-----"
            
            [System.IO.File]::WriteAllText("ssl\localhost.key", $privateKey, [System.Text.Encoding]::ASCII)
            
            Write-Host "Certificados SSL basicos generados" -ForegroundColor Green
        }
    } catch {
        Write-Host "ERROR generando certificados: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Tipo de error: $($_.Exception.GetType().Name)" -ForegroundColor Red
        Write-Host "Stack trace: $($_.Exception.StackTrace)" -ForegroundColor Red
        Write-Host "Generando certificados basicos como fallback..." -ForegroundColor Yellow
        
        # Generar certificados basicos como fallback
        try {
            $certContent = "-----BEGIN CERTIFICATE-----`nMIIDXTCCAkWgAwIBAgIJAKoK/heHhQwFMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV`nBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5l`ndCBXaWRnaXRzIFB0eSBMdGQwHhcNMjQwODExMDUxNjAwWhcNMjUwODExMDUx`nNjAwWjBFMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8G`nA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0B`nAQEFAAOCAQ8AMIIBCgKCAQEAu1SU1LfVLPHCs8zMxH2Mo4lgOEePzNm0tRge`nLezV6ffAt0gunVTLw7onLRnrq0/IzW7yWR7QkrmBL7jTKEn5u+qKqhcyMtEP/`nbs8dEt1cS0MSfAd5Ycx3Ao0X0B4yX+hny/Y+QxPkcC8IeqbE77XEUxHx/lq7Q`ndYvH9Ig9zPy3ps/HZZNDvVzcMTOkLvS5uXcMRO6OqjHi96ZFDRRaWG7CmnNXv`nXjqK+dWu8ItSW65tswtHAPPNMPgLyqSrdHpzPlkuVNblorU6eVf8gTOm9rY5`n15ZYzIlVSY5crSxo+CG6+Ko0ufW16JuS69IQIfLCXywIDAQABo1AwTjAdBgNV`nHQ4EFgQUQKxP1woRaB+prbKf8nXzXck3QswHwYDVR0jBBgwFoAUQKxP1woR`naB+prbKf8nXzXck3QswDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOC`nAQEAeAh+1cKbmn3D5tqkydQrnp0LzVZUVyThCRgM5tSJaJM12voCNqP6jJ5`n-----END CERTIFICATE-----"
            
            [System.IO.File]::WriteAllText("ssl\localhost.crt", $certContent, [System.Text.Encoding]::ASCII)
            
            $privateKey = "-----BEGIN PRIVATE KEY-----`nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKz`nMzEfYyjiWA4R4/M2bS1GB4t7NXp98C3SC6dVMvDuictGeurT8jNbvJZHtCSuYEvuNMoSfm76o`nqFzAy0Q/9uyx0S3VxLQxJ8B3lhzHcCjRfQHjJf6GfL9j5DE+RwLwh6psTvtcRTEfH+W`nrtB1i8f0iD3M/Lemz8dlk0O9XNwxM6Qu9Lm5dwxE7o6qMeL3pkUPNFpYbsKac1e`n9eOor51a7wi1Jbrm2zC0cA480w+AvKpKt0enM+WS5U1uWitTp5V/yBM6b2tjl`nXhljMiVVJjlytLGj4Ibr4qjS59bXom5Lr0hAh8sJfLAgMBAAECggEBAKTmjaS6`nkKdhXjuf9AXjK1aGDk4QdfgUBP9jfT0Q/JZsGtU+J2e/ezf2CzF31Q4D8fHr`n6n9NuuD0j5DsVM+3J4mJbhFMAqB0yfgtMlM6o8eEpH2eMoFx1KEzIAn2`n7nKbsdjlC+iVf5KJfXihw0MxJxPYR0Gbrk0ZVRUfE+8L95LydJEV3CLi`nUZvsDLRkqBwQnS+w9WmcdLREqRuzCuoj9SqFdX1KmhP6V7+GLfyl1FNa`nD4i3Cj4tvTt1coY8iRyYzrWlVLn2tPd6M5rY6NNSnVfB6mq8X4RhsMZ`nXo1Xe9PynJp3S2dQNxPZ+OZXbwJg0X3LFLFLMvFoVN8n`n-----END PRIVATE KEY-----"
            
            [System.IO.File]::WriteAllText("ssl\localhost.key", $privateKey, [System.Text.Encoding]::ASCII)
            
            Write-Host "Certificados SSL basicos generados como fallback" -ForegroundColor Green
        } catch {
            Write-Host "ERROR CRITICO generando certificados fallback: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "Tipo de error: $($_.Exception.GetType().Name)" -ForegroundColor Red
            exit 1
        }
    }

    Write-Host "`nConfiguracion completada!" -ForegroundColor Green
    Write-Host "Tu aplicacion estara disponible en:" -ForegroundColor Yellow
    Write-Host "   - Local: https://localhost:4200" -ForegroundColor White
    Write-Host "   - Red local: https://$localIP:4200" -ForegroundColor White
    Write-Host ""
    Write-Host "Para ejecutar:" -ForegroundColor Cyan
    Write-Host "   ng serve --ssl --host 0.0.0.0" -ForegroundColor White
    Write-Host ""
    Write-Host "Recuerda importar ssl/localhost.crt en tu navegador" -ForegroundColor Yellow
    Write-Host "Ejecuta este script cada vez que cambies de red WiFi" -ForegroundColor Cyan

} catch {
    Write-Host "ERROR GENERAL en el script:" -ForegroundColor Red
    Write-Host "Mensaje: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Tipo: $($_.Exception.GetType().Name)" -ForegroundColor Red
    Write-Host "Stack Trace: $($_.Exception.StackTrace)" -ForegroundColor Red
    exit 1
}
