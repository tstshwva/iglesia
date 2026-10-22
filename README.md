# Siloé - Iglesia Presbiteriana

Aplicación web en español para administrar miembros, asistencia, eventos, ministerios, aportaciones y comunicados. Incluye cinco roles y almacenamiento permanente en SQLite.

## Abrir la aplicación en Windows

1. Instalar **Node.js 24 o posterior**.
2. Abrir esta carpeta y hacer doble clic en **iniciar.cmd**. Mantener abierta la ventana que aparece: es el servidor.
3. Visitar **http://127.0.0.1:3000**. Si el navegador abre antes que el servidor, actualizar la página.
4. Registrar el primer administrador. Usar una contraseña de al menos 12 caracteres.
5. Iniciar sesión y completar los datos de la iglesia en Configuración.

Alternativa desde una terminal, situada en esta carpeta:

```sh
npm start
```

No hace falta `npm install`: la aplicación utiliza módulos incluidos en Node.js. No existen cuentas ni contraseñas predeterminadas. Los datos iniciales están vacíos intencionalmente.

![Fotografía ilustrativa de un templo](https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1000&q=85)

La fotografía de Unsplash es ilustrativa; no representa el edificio real de Siloé. Las pantallas de acceso y panel utilizan esta fotografía y necesitan internet para cargarla. El resto de la aplicación funciona sin esa imagen.

## Documentación

- [Manual de usuario](docs/MANUAL.md)
- [Requisitos y criterios de aceptación RF-01 a RF-10](docs/REQUISITOS.md)
- [Arquitectura, API y base de datos](docs/TECNICO.md)
- [Instalación, recuperación y alojamiento](docs/OPERACION.md)
- [Validación y límites conocidos](docs/VALIDACION.md)

## Pruebas

```sh
npm test
```

La prueba de integración crea una base temporal y verifica autenticación, permisos de los cinco roles, conservación de miembros inactivos, aportaciones y prevención de asistencias duplicadas. No modifica la base de uso real.

## Respaldo

Los datos están en `data/church.sqlite`. Detener el servidor antes de copiar la carpeta `data/` completa a una ubicación segura. Esta carpeta está excluida de Git para impedir subir información de miembros, aportaciones o contraseñas.

## GitHub

Repositorio de destino: https://github.com/tstshwva/iglesia.git

Subir código a GitHub **no publica el servidor**. GitHub Pages solo sirve archivos estáticos y no puede ejecutar esta aplicación con autenticación y SQLite. Consultar el manual de operación para alojamiento.

## Alcance de esta entrega

Exportación para Excel mediante archivos .xlsx y PDF mediante el diálogo de impresión del navegador. La recuperación de contraseñas genera tokens de un solo uso; el envío automático por correo requiere configurar un servicio `RESET_WEBHOOK`. Las capturas reales de pantallas permanecen pendientes de verificar la vista local en el equipo; no se incluyen imágenes simuladas como evidencia de pruebas.

