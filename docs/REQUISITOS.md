# Requisitos RF-01 a RF-10

| RF | Funciones implementadas | Validación / configuración |
|---|---|---|
| RF-01 | Correo y contraseña, alta/edición/desactivación, roles, cierre, cambio personal y recuperación SMTP | Autorización de API, invalidación de sesiones, último administrador protegido. Entrega SMTP probada localmente; falta configurar correo real. |
| RF-02 | Alta rápida, edición, listado, nombre/teléfono/correo/ingreso, búsqueda, estados y baja lógica | Duplicados advertidos con confirmación para homónimos. Excel/CSV con revisión previa. |
| RF-03 | Evento y fecha, presentes/ausentes, edición e historial | Búsqueda, marcado masivo, reporte semanal/mensual, porcentaje y nombres. No duplica evento-fecha. |
| RF-04 | Crear, modificar y cancelar, responsable, lugar, descripción y calendario mensual | Historial conservado; no acepta asistencia nueva en cancelados. |
| RF-05 | Ministerios, coordinadores, integrantes y actividades vinculadas | Reporte de integrantes, actividades y asistencias en actividades del ministerio por periodo. |
| RF-06 | Fecha/monto/concepto/método, aportantes opcionales, anónimos y resumen mensual | Acceso financiero exclusivamente administrador/tesorero, incluso vía API de reportes. |
| RF-07 | Alta, edición, eliminación y fecha de publicación | Anuncios futuros no se muestran todavía en el panel. |
| RF-08 | Activos, próximos eventos, asistencias, ministerios, ingresos y gráficas | Gráficas de asistencia, ingreso de miembros e ingresos mensuales según rol. |
| RF-09 | Miembros, asistencia por evento, participación por ministerio e ingresos por periodo | Excel nativo y PDF directo con logo. Filtros se validan en servidor. |
| RF-10 | Nombre, logo, portada, dirección, contacto y horarios | Identidad dinámica en acceso, navegación y reportes. Subida, vista previa y retirada de imágenes. |

## Permisos de escritura

| Módulo | Administrador | Pastor | Secretario | Tesorero | Coordinador |
|---|---|---|---|---|---|
| Miembros / importación | Sí | Sí | Sí | No | No |
| Eventos | Sí | Sí | Sí | No | Sí |
| Asistencia | Sí | Sí | Sí | No | Sí |
| Ministerios | Sí | Sí | Sí | No | Sí |
| Aportaciones: consulta y escritura | Sí | No | No | Sí | No |
| Comunicados | Sí | Sí | Sí | No | No |
| Usuarios / configuración | Sí | No | No | No | No |

Todos los roles autenticados consultan módulos no financieros y sus reportes. El acceso financiero no se obtiene ocultando botones: lo comprueba el servidor en todas sus rutas. Cada usuario puede cambiar su propia contraseña.

## Dependencias externas y aceptación

El código está implementado; una entrega operativa en internet también necesita dominio/HTTPS, alojamiento con disco persistente y datos SMTP reales. Las pruebas de servidor y PDF son evidencia automatizada/visual, pero no sustituyen la aceptación de todas las pantallas en el navegador del usuario. Ver VALIDACION.md.
