# Comunidad Siloé

La segunda página se abre desde **Ver comunidad** o en /comunidad, usando el mismo puerto que muestra iniciar.cmd. El panel está en /admin. No requiere otra base de datos.

## Registro y aprobación

1. La persona elige Crear cuenta e indica nombre, correo y contraseña. Puede agregar teléfono y contactos de recuperación.
2. La solicitud aparece en **Miembros**, en el panel del administrador, pastor o secretario. Aún no es un miembro activo.
3. La persona verifica su correo con el enlace recibido. En desarrollo sin SMTP, el código se muestra en la ventana del servidor; no se entrega un correo real.
4. Un responsable aprueba o rechaza. Si existe un miembro con ese correo, puede vincularlo; si no existe, se crea. Si hay varias coincidencias se exige elegir. No se puede vincular una persona de otro correo.
5. La cuenta aprobada puede consultar publicaciones para miembros y confirmar su intención de asistir a eventos. Esa confirmación no registra asistencia real al culto.

La cuenta pública siempre obtiene el rol miembro. No permite consultar directorios, aportaciones, reportes ni administración. Desactivar el miembro retira su acceso al contenido reservado.

## Publicar contenidos

En eventos, avisos y ministerios selecciona la publicación: pública, para miembros aprobados o privada. Los registros anteriores permanecen privados hasta cambiar esta opción. Los avisos con fecha futura esperan a su publicación.

Para eventos agrega lugar y dirección completa; opcionalmente fotografía. La comunidad muestra búsqueda, filtros, calendario y detalle con Google Maps y Apple Maps. Los enlaces abren indicaciones hacia la dirección indicada. Comprueba que la dirección sea correcta antes de publicar.

El evento permite descargar un archivo ICS para agregarlo al calendario, compartir su enlace y confirmar o retirar la intención de asistir. La administración ve el total de confirmaciones. Las cancelaciones se conservan y bloquean nuevas confirmaciones.

## Identidad y cuenta

Nombre, logo, portada, contacto y horarios provienen de Configuración de la iglesia. Cada persona puede actualizar sus contactos de recuperación y contraseña usando su contraseña actual. El teléfono no envía SMS.

## Puesta en servicio

Para que otras personas accedan desde sus teléfonos hace falta alojamiento con HTTPS, disco persistente y APP_URL configurada. La dirección 127.0.0.1 solo funciona en el equipo del servidor. Configura SMTP para verificación y recuperación reales; la verificación usa el correo principal, la recuperación usa el alternativo cuando existe. GitHub almacena el código y no hospeda este servidor.

Sugerencias siguientes: QR del enlace público, recordatorios voluntarios, turnos de servidores, cumpleaños opcionales y respaldos automáticos. No están implementados todavía.
