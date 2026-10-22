# Validación de la entrega

## Comprobaciones realizadas

- Análisis de sintaxis del servidor y JavaScript de interfaz: satisfactorio.
- Prueba de integración `npm test`: satisfactoria.
- Configuración inicial de un solo uso y contraseña mínima.
- Inicio de sesión correcto / incorrecto y cierre de sesión.
- API sin sesión rechazada.
- Permisos de escritura y restricciones financieras para cinco roles.
- Persistencia de miembro inactivo y bloqueo de eliminación permanente.
- Asistencia por evento y prevención de duplicados.
- Aportación anónima aceptada y monto negativo rechazado.

## Pendientes y límites

La vista en el navegador integrado no consiguió acceder al servidor local: conexión agotada. No se certifica todavía la revisión visual, la impresión PDF ni el comportamiento móvil por una prueba de navegador. La fotografía incluida es ilustrativa, no una captura de la aplicación.

El envío real de recuperación por correo requiere configurar un proveedor. La exportación para Excel es CSV, no XLSX. La asociación específica de actividades con ministerios se describe de manera textual; el calendario actual es general. No hay envío de anuncios por correo ni acceso público de miembros.

## Lista de revisión manual en el equipo

1. Ejecutar iniciar.cmd y crear administrador.
2. Configurar institución y cargar logotipo.
3. Crear usuarios de cada rol y revisar visibilidad de finanzas.
4. Registrar miembros, buscar, filtrar y desactivar.
5. Crear evento, revisar calendario y cancelar.
6. Registrar/corregir asistencia y consultar periodos.
7. Crear ministerio y vincular miembros.
8. Registrar aportación nominativa y anónima.
9. Publicar, editar y eliminar comunicado.
10. Generar CSV y PDF; probar en pantalla pequeña.
11. Capturar pantallas reales de acceso, panel, miembros, calendario y reportes para adjuntar al manual.

No incluir datos personales reales, correos privados ni montos sensibles en capturas destinadas al repositorio público.
