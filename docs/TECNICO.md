# Documentación técnica

## Arquitectura

Navegador → HTTP mismo origen → servidor Node.js → SQLite en disco.

Se eligió Node.js 24 con módulos integrados para reducir instalación y dependencias. `node:http` sirve la aplicación y API, `node:sqlite` mantiene datos y `node:crypto` deriva claves. La interfaz utiliza HTML, CSS y JavaScript, sin compilación.

## Archivos

- `server.js`: rutas, autorización, validación y persistencia.
- `public/index.html`: documento de entrada.
- `public/app.js`: vistas, formularios, calendario, consultas y exportación.
- `public/style.css`: diseño adaptable y reglas de impresión.
- `public/export.js`: creación de libros Excel nativos, sin dependencias.
- `test/integration.test.js`: integración sobre base temporal.
- `data/`: información local excluida de Git.

## Modelo de datos

| Tabla | Campos principales | Propósito |
|---|---|---|
| users | id, name, email UNIQUE, password, role | Cuentas y contraseña derivada |
| sessions | token PK, user_id FK, expires | Sesiones de 8 horas; guarda hash SHA-256 del token |
| resets | token PK, user_id FK, expires | Recuperación de un uso; hash y vencimiento |
| records | id, kind, body | Registros por módulo con contenido JSON |
| settings | id=1, body | Configuración institucional |

Tipos de `records`: members, events, attendance, ministries, donations y announcements. Los identificadores son globales. Una asistencia guarda `eventId`, `date`, `present[]` y `absent[]`; un ministerio guarda `members[]`; una aportación puede tener `memberId` vacío. El formato JSON facilita esta primera versión, pero varias relaciones dependen de validación de aplicación y no de claves foráneas de SQLite.

## API

Todas las respuestas de API son JSON. Escrituras usan JSON en el cuerpo. La cookie `session` es HttpOnly y SameSite=Strict.

| Ruta | Método | Uso |
|---|---|---|
| /api/status | GET | Identificar configuración inicial |
| /api/setup | POST | Crear primer administrador, una sola vez |
| /api/login | POST | Autenticar y crear sesión |
| /api/logout | POST | Revocar sesión |
| /api/forgot | POST | Solicitar token de recuperación |
| /api/reset | POST | Canjear token y cambiar contraseña |
| /api/me | GET | Usuario actual y permisos |
| /api/users | GET / POST | Listar o registrar usuarios, solo administrador |
| /api/settings | GET / PUT | Consultar / modificar configuración |
| /api/{módulo} | GET / POST | Listar / crear registros |
| /api/{módulo}/{id} | PUT | Editar registros |
| /api/announcements/{id} | DELETE | Eliminar comunicado |

Los módulos se indican con los nombres técnicos de `records`. Códigos: 200 éxito, 201 creado, 400 validación, 401 sin sesión, 403 sin permiso, 404 inexistente.

## Seguridad implementada

Contraseñas derivadas con scrypt y sal aleatoria, comparación de tiempo constante, sesiones aleatorias, autorización en servidor, consultas parametrizadas, escape de texto en HTML, comprobación de origen, política CSP y exportación Excel con celdas de texto para impedir fórmulas. Límite básico de intentos por dirección en memoria. La API financiera rechaza usuarios no autorizados antes de consultar datos.

Antes de exposición pública: HTTPS, cookie Secure, servicio de correo privado, instalación inicial controlada, permisos de archivos y copias de seguridad. No incluye segundo factor, auditoría completa, gestión de sesiones entre múltiples instancias ni administración de bajas de usuarios. No usar varias instancias del servidor sobre archivos SQLite diferentes.

