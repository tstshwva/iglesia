# Matriz de requisitos y aceptación

| RF | Implementación | Criterio de aceptación / límite |
|---|---|---|
| RF-01 | Primer administrador, alta de usuarios por administrador, correo/contraseña, cierre de sesión, cinco roles, tokens de recuperación | Solicitudes sin sesión devuelven 401; operaciones fuera del rol devuelven 403. Envío de recuperación por correo pendiente de configurar proveedor. |
| RF-02 | Alta, consulta, edición, nombre/teléfono/correo/ingreso, búsqueda, filtro, desactivación | Desactivar conserva el registro. La API rechaza eliminar un miembro. |
| RF-03 | Asistencia por evento y fecha, presentes/ausentes, edición, historial y filtros semanales/mensuales | No permite duplicar evento-fecha ni incluir miembros inexistentes. |
| RF-04 | Alta, edición y cancelación de eventos, responsable, calendario mensual | Cancelado permanece en historial y se excluye de próximos eventos. |
| RF-05 | Ministerios, coordinador e integrantes | Miembros vinculados mediante identificadores. Actividades generales visibles; vinculación estructurada evento-ministerio pendiente. |
| RF-06 | Aportaciones, fecha/monto/concepto/método, anónimos, resumen por periodo | Solo administrador y tesorero acceden a la API financiera; montos positivos. |
| RF-07 | Publicar, editar y eliminar anuncios con fecha | El panel muestra únicamente anuncios cuya publicación ya inició. |
| RF-08 | Totales, próximos eventos, ingresos según rol y gráfica de asistencia | Cálculos a partir de los registros guardados; sin datos ficticios. |
| RF-09 | Tablas de miembros, asistencia por evento, integrantes por ministerio e ingresos por periodo | Descarga CSV compatible con Excel; PDF por impresión. No incluye archivo nativo .xlsx. |
| RF-10 | Nombre, logotipo, dirección, contacto y horarios | Solo el administrador actualiza la configuración; persistencia en SQLite. |

## Permisos

Todos los roles autenticados pueden consultar miembros, eventos, asistencia, ministerios y comunicados, además de sus reportes. La tabla indica permisos de escritura:

| Módulo | Administrador | Pastor | Secretario | Tesorero | Coordinador |
|---|---|---|---|---|---|
| Miembros | Sí | Sí | Sí | No | No |
| Eventos | Sí | Sí | Sí | No | Sí |
| Asistencia | Sí | Sí | Sí | No | Sí |
| Ministerios | Sí | Sí | Sí | No | Sí |
| Aportaciones (leer/escribir) | Sí | No | No | Sí | No |
| Comunicados | Sí | Sí | Sí | No | No |
| Usuarios / configuración | Sí | No | No | No | No |

El coordinador puede operar todos los ministerios: esta versión no limita a un coordinador a un único grupo. La política se define en el servidor y no depende de esconder botones.
