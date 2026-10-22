# Manual de usuario

## Primer acceso

Ejecutar `iniciar.cmd`, esperar el mensaje de disponibilidad y abrir http://127.0.0.1:3000. En la primera ejecución, registrar nombre, correo y contraseña del administrador. Después, iniciar sesión. El registro de nuevas cuentas del sistema queda reservado al administrador; esto evita que una persona pueda asignarse privilegios por su cuenta.

## Usuarios y sesiones

El administrador abre **Usuarios → Registrar**, ingresa nombre, correo, contraseña de 12 caracteres y rol. No compartir una cuenta entre varias personas. La sesión dura ocho horas; utilizar **Salir** o **Cerrar sesión** al terminar.

Para recuperar acceso, elegir **Olvidé mi contraseña** e ingresar el correo. En instalaciones con servicio de envío configurado se recibe un token. Elegir **Tengo un token**, introducirlo y definir una nueva contraseña. El token vence en 30 minutos, se utiliza una sola vez e invalida las sesiones anteriores. En modo local, un administrador debe revisar el token en la salida del servidor; este modo no envía correo.

## Panel principal

Muestra miembros activos, próximos eventos, asistencias registradas y ministerios. Administrador y tesorero también ven el total de ingresos. La gráfica muestra el número de presentes de hasta seis asistencias recientes. No se muestran cifras ficticias cuando aún no existen registros.

## Miembros

1. Abrir **Miembros → Registrar**.
2. Capturar nombre, teléfono, correo opcional, fecha de ingreso y estado.
3. Guardar; utilizar la búsqueda para localizar por nombre.
4. Filtrar por activo o inactivo.
5. Para una baja, editar el miembro y seleccionar **Inactivo**. El registro y su historial permanecen guardados.

## Eventos

Registrar título, fecha, hora, lugar, responsable y descripción. El responsable se captura por nombre. El botón **Calendario mensual** permite recorrer los meses. Para cancelar, editar y cambiar el estado a **Cancelado**; el evento se conserva y deja de aparecer entre los próximos encuentros.

## Asistencia

Primero registrar los miembros y el evento. En **Asistencia → Registrar asistencia**, seleccionar el evento y la fecha. Marcar presentes; los miembros restantes del listado quedan ausentes. Guardar. No se permite más de una lista para el mismo evento y fecha. Se puede editar una lista existente para corregirla. Los miembros previamente registrados en una lista siguen disponibles para corregir el historial aunque posteriormente se desactiven.

## Ministerios

Registrar nombre (por ejemplo Música, Jóvenes, Niños, Enseñanza o Servicio), coordinador y descripción. Marcar integrantes para vincularlos al ministerio. El listado muestra sus nombres. La sección de actividades muestra el calendario general; la asociación de una actividad concreta con un ministerio se documenta en el evento mediante su descripción y responsable.

## Aportaciones

Solo administrador y tesorero pueden acceder. Registrar fecha, monto positivo, concepto y método. Seleccionar un miembro o dejar **Anónima**. Los montos se muestran en pesos mexicanos. Para consultar un mes: **Reportes → Aportaciones → Mes actual → Consultar**. El total del periodo aparece sobre la tabla.

## Comunicados

Registrar título, fecha de publicación y contenido. Los comunicados con fecha futura permanecen en el listado administrativo y aparecen en el panel a partir de la fecha indicada. Se pueden editar y eliminar; la eliminación pide confirmación.

## Reportes

Elegir miembros, asistencia, ministerios o aportaciones según permisos. Seleccionar fechas o utilizar últimos siete días / mes actual. Para asistencia, seleccionar un evento específico. Presionar **Consultar**.

- **Excel (CSV):** descarga una tabla UTF-8 que abre Excel. Si Excel no separa las columnas automáticamente, usar Datos → Desde texto/CSV y seleccionar coma como separador.
- **Imprimir / PDF:** abre la impresión del navegador. Seleccionar Guardar como PDF. La hoja excluye navegación y botones.

Los filtros de fecha se aplican a fecha de ingreso para miembros y a fecha de registro para asistencia y aportaciones. Los ministerios no tienen fecha propia: consultar ese reporte sin filtro de fechas.

## Configuración

Solo administrador. Actualizar nombre, dirección, teléfono, correo, horarios y logotipo. Se admiten PNG, JPEG y WebP de hasta 500 KB. El nombre actualizado aparece en la cabecera y reportes. Los horarios son información institucional; no crean automáticamente eventos recurrentes.
