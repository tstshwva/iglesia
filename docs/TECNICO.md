# Arquitectura y API · versión 2

Navegador HTML/CSS/JavaScript → servidor Node.js 24 → SQLite en disco. Se conservó la base anterior y se migra users.active si falta.

## Organización

- server.js: HTTP, autenticación, autorización y persistencia.
- lib/domain.js: validación, normalización y duplicados.
- lib/import.js: lectura Excel/CSV, límites y revisión de filas.
- lib/mail.js: SMTP y webhook de recuperación.
- lib/reports.js: consultas por periodo y generación PDF.
- public/app.js: pantallas, formularios y calendario.
- public/export.js: libro Excel con celdas de texto, evitando fórmulas inyectadas.
- launch.js: preparación inicial y elección de puerto libre con comprobación de salud.
- test/: integración de API, correo de prueba y exportación Excel.

Dependencias: Nodemailer para SMTP; read-excel-file para .xlsx; Sharp para validar, orientar, reducir y convertir imágenes; PDFKit para PDF. package-lock.json fija el árbol de dependencias.

## Base de datos

| Tabla | Campos | Uso |
|---|---|---|
| users | id, name, email UNIQUE, password, role, active | Cuentas y baja lógica |
| sessions | token PK, user_id FK, expires | Hash del token y duración de ocho horas |
| resets | token PK, user_id FK, expires | Recuperación de un uso, 30 minutos |
| records | id, kind, body JSON | Entidades por módulo |
| settings | id=1, body JSON | Identidad institucional e imágenes PNG |

Miembro: name, phone, email, joined, active, family. Evento: ministryId opcional. Ministerio: members[] de identificadores. Asistencia: eventId, date, present[], absent[]. Aportación: memberId opcional. No hay eliminación permanente de miembros/eventos/finanzas. Las relaciones JSON se validan en la aplicación.

## API

| Ruta | Método | Uso |
|---|---|---|
| /health | GET | Salud, nombre técnico y versión |
| /api/status | GET | Versión y configuración inicial |
| /api/branding | GET | Solo nombre, logo y portada públicos |
| /api/setup | POST | Primer administrador; X-Setup-Token si está configurado |
| /api/login, /api/logout | POST | Abrir / cerrar sesión |
| /api/forgot, /api/reset | POST | Solicitar / canjear token |
| /api/me | GET | Cuenta, rol y permisos |
| /api/account/password | POST | Cambio con contraseña actual |
| /api/users | GET / POST | Listar / crear, solo administrador |
| /api/users/:id | PUT | Nombre, correo, rol, estado y contraseña opcional |
| /api/settings | GET / PUT | Configuración; escritura solo administrador |
| /api/system | GET | Estado del correo sin revelar credenciales; solo administrador |
| /api/{módulo} | GET / POST | Consultar / crear |
| /api/{módulo}/:id | PUT | Editar |
| /api/announcements/:id | DELETE | Eliminar comunicado |
| /api/members/import/preview | POST | Base64, type xlsx/csv; devuelve filas y token de revisión |
| /api/members/import/commit | POST | Guarda filas aceptadas mediante token, transacción y nueva revisión de duplicados |
| /api/reports/{members,attendance,ministries,donations} | GET | Consultas con from/to/event/ministry/state |
| /api/reports/{tipo}/pdf | GET | Descarga autorizada de PDF |

Respuestas JSON, salvo descargas PDF. La importación limita archivos a 2 MB y 1000 filas y revisa el tamaño declarado del ZIP. Los tokens de revisión pertenecen a una cuenta, vencen en diez minutos y se consumen una vez. No se confían al navegador las filas que finalmente se insertan.

## Seguridad

Scrypt con sal, comparación constante, cookies HttpOnly/SameSite, caducidad, revocación de sesiones, comprobación de origen, CSP, consultas parametrizadas, validación de datos y escape HTML. Las imágenes se procesan con límite de píxeles y sin metadatos. La marca NODE_ENV=production impide imprimir tokens de recuperación. Límite básico de intentos por dirección en memoria; para muchos usuarios detrás de un proxy conviene configurar una capa de acceso y límites acorde a esa infraestructura.

No hay segundo factor, auditoría de todas las modificaciones ni separación de coordinadores por un ministerio concreto. No usar varias instancias independientes con archivos SQLite distintos.

## Referencias técnicas

- https://nodemailer.com/smtp
- https://github.com/catamphetamine/read-excel-file
- https://pdfkit.org/docs/getting_started.html
- https://sharp.pixelplumbing.com
