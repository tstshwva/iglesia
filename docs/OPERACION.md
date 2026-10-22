# Instalación y operación

## Entorno local

Instalar Node.js >=24, ejecutar `iniciar.cmd` o `npm start` y navegar a http://127.0.0.1:3000. No cerrar la terminal mientras se usa la aplicación. Para detener, presionar Ctrl+C en la terminal. Si otro programa utiliza el puerto, establecer `PORT` con otro valor y abrir la dirección correspondiente.

Ejemplo en PowerShell:

```powershell
$env:PORT='4317'
npm start
```

El host predeterminado es 127.0.0.1, accesible únicamente desde el equipo. El navegador integrado de una herramienta puede estar aislado de este servidor; en ese caso utilizar el navegador del propio equipo después de ejecutar el iniciador.

## Variables de entorno

`.env.example` enumera los nombres; copiarlo a `.env` no carga las variables automáticamente. Configurarlas en el entorno del proceso o proveedor de alojamiento. Nunca subir secretos.

| Nombre | Uso |
|---|---|
| PORT | Puerto HTTP, 3000 por defecto |
| HOST | Dirección de escucha, 127.0.0.1 por defecto |
| DB_PATH | Ruta de base de datos; directorio padre debe existir |
| COOKIE_SECURE | `true` con HTTPS |
| SETUP_TOKEN | Protección opcional de la configuración inicial mediante cabecera X-Setup-Token |
| RESET_WEBHOOK | Endpoint privado para enviar token por correo |
| RESET_WEBHOOK_SECRET | Bearer para autenticar el servicio de correo |

Si se configura SETUP_TOKEN, el formulario inicial no envía esa cabecera: crear el administrador mediante una llamada API autorizada o realizar la configuración local antes del despliegue. No publicar un servidor sin configurar su administrador.

## Recuperación por correo

El servicio `RESET_WEBHOOK` recibe un POST con `{email, token, expiresMinutes:30}` y Authorization Bearer. Debe enviar el token a esa dirección y responder satisfactoriamente. No se provee un proveedor de correo ni credenciales en esta entrega. Sin configuración se imprime el token en la terminal para desarrollo; proteger los registros y no utilizar ese modo en producción.

## Respaldo y restauración

1. Detener el proceso Node.
2. Copiar la carpeta `data/` a almacenamiento privado y protegido.
3. Reiniciar el servidor.
4. Para restaurar, detener, conservar copia del estado actual y reemplazar `data/` por el respaldo.

Comprobar la restauración antes de depender de una copia. No subir esa carpeta a GitHub.

## Alojamiento

Requiere un servidor Node.js con volumen persistente para SQLite y proxy HTTPS. GitHub aloja el código; GitHub Pages no ejecuta este servidor. Configurar variables, respaldos y dominio en el proveedor elegido. No se ha contratado ni desplegado alojamiento externo en esta entrega.

## Actualizaciones de GitHub

Revisar cambios, ejecutar `npm test`, confirmar con Git y subir al repositorio. Las actualizaciones son explícitas por entrega; no existe sincronización automática en segundo plano. Para subir desde este equipo es necesario autenticar GitHub y tener permiso de escritura sobre `tstshwva/iglesia`.
