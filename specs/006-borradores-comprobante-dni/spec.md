# Feature Specification: Comprobante en modal, borradores editables, DNI automático y conexión con API_UNDC (frontend)

**Feature Branch**: `feat/borradores-edicion`

**Created**: 2026-10-14

**Status**: Implementada (2026-10-14)

**Input**: «Ver comprobante que se muestre allí mismo, con un modal responsive»; «cómo agrego otro equipo en una disciplina y su costo
adicional»; «un mismo alumno no debería inscribir otro salón»; «botón de atrás en el registro de equipos y poder seguir editando
hasta Enviar»; «el administrador edita los inscritos»; «que el DNI aparezca solo desde la API».

**Depende de**: `backend/specs/006-borradores-edicion-dni-automatico` (implementada). Esta spec solo cubre las pantallas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el comprobante sin salir de la página (Priority: P1)

«Ver comprobante» (en el hub del delegado, en Salones y ciclos del administrador y en la revisión de equipos) abre un **modal** con la
imagen ajustada a la pantalla, el monto, el N.º de operación y el estado.

**Acceptance Scenarios**:

1. **Given** un comprobante, **When** se pulsa «Ver comprobante», **Then** se abre el modal sobre la misma página (sin pestaña nueva).
2. **Given** el modal, **Then** la imagen cabe en pantalla en móvil y en escritorio; «Tamaño real» permite desplazarse por la imagen y
   «Abrir en otra pestaña» sigue disponible.
3. **Given** una imagen que no carga, **Then** se muestra un aviso en lugar de un recuadro vacío.
4. **Given** un modal dentro de otro (revisión de equipo), **Then** el del comprobante queda por encima.

### User Story 2 - Registrar equipos como borrador, volver y enviar (Priority: P1)

En el formulario de equipo hay **«← Volver»**, **«Guardar borrador»** y **«Enviar inscripción»**. El borrador se puede reabrir desde el hub
(«Editar»), enviar («Enviar») o quitar («Quitar»); después de enviarlo solo lo edita un administrador.

**Acceptance Scenarios**:

1. **Given** un equipo nuevo, **When** se pulsa «Guardar borrador», **Then** queda guardado (aunque falte DNI o capitán), el formulario
   pasa a modo edición y el hub lo lista como «Borrador».
2. **Given** un borrador, **When** se vuelve a abrir, **Then** se carga con su nombre, celular, jugadores y capitán; guardar actualiza el mismo
   equipo sin crear otro.
3. **Given** un borrador incompleto, **When** se pulsa «Enviar inscripción», **Then** se muestran los motivos (mínimo de jugadores,
   capitán, DNI de cada integrante) y nada se envía; completo, pasa a «Pendiente» y se vuelve al hub.
4. **Given** cambios sin guardar, **When** se pulsa «Volver», **Then** se pide confirmación antes de descartarlos.
5. **Given** un equipo ya enviado, **Then** el hub no ofrece «Editar»; un equipo rechazado muestra su motivo y permite registrar otro.

### User Story 3 - Un salón o ciclo por alumno y equipos adicionales visibles (Priority: P1)

El formulario «Inscribir otro salón o ciclo» solo aparece si el estudiante no tiene un salón activo en el evento (o su pago fue
rechazado). Cada disciplina con un equipo muestra la regla «1.º incluido · cada adicional S/ X con su comprobante» y un botón
«+ Equipo adicional · S/ X».

### User Story 4 - DNI automático (Priority: P2)

Al buscar un alumno por código, si la API trae el DNI el campo ya viene lleno (marcado «Del padrón») y sigue editable; si no, se indica
«No figura en el padrón: escríbelo». 

### User Story 5 - El administrador edita los inscritos (Priority: P1)

En la revisión de un equipo (Owner y Administrador, nunca el Tesorero) hay **«Editar equipo»**: nombre, celular, quitar o agregar jugadores
por código o DNI y cambiar el capitán. Las reglas las valida el servidor y se muestran sus mensajes. Hay un filtro «Borradores».

### User Story 6 - Conectar API_UNDC desde Integraciones (Priority: P2)

En **Admin → Integraciones**, la tarjeta «Padrón de estudiantes (API UNDC)» permite guardar la URL y la API key, activar o desactivar,
**Probar** y quitar la conexión. La key se escribe en un campo `password`, se envía una vez y nunca se guarda en el navegador.

## Requirements *(mandatory)*

- **FR-001**: Un único componente `VoucherViewerModal` (sobre `AppModal`) sirve a todas las pantallas; `AppModal` queda por encima del menú lateral.
- **FR-002**: El formulario usa `POST /registrations` (con `draft=true` al guardar un borrador nuevo), `PATCH /registrations/:id` al guardar
  uno existente y `POST /registrations/:id/submit` para enviar; el hub usa `submit` y `DELETE`.
- **FR-003**: La pantalla no decide permisos: oculta acciones por rol y estado, pero el servidor es la autoridad y sus mensajes se muestran.
- **FR-004**: La búsqueda de personas se comparte entre el formulario del delegado y el editor del administrador (`useRosterSearch`).
- **FR-005**: La API key de API_UNDC nunca se guarda en cookies, `localStorage`, `sessionStorage`, stores ni consola; solo se muestra su máscara.
- **FR-006**: «Validar pago» se desactiva mientras el comprobante no cubra ningún equipo enviado; el Tesorero no ve borradores.

## Success Criteria

- **SC-001**: Un alumno arma un equipo en dos sesiones y lo envía sin que el tesorero lo vea antes.
- **SC-002**: Ningún flujo del comprobante abre una pestaña nueva salvo el enlace explícito del modal.
- **SC-003**: Con API_UNDC conectada, buscar un alumno por código no obliga a escribir su DNI.

## Evidencia de verificación

- **Tipos y build**: `vue-tsc` 3.3.13 con TypeScript 5.9.3 → solo los 10 errores previos (`fixture.vue`, `utils/sports.ts`,
  `nuxt.config.ts`), ninguno en archivos tocados; `bun run build` correcto.
- **Navegador** (frontend compilado en 3000 contra la API local 3030, API_UNDC local 3020 y SIVIRENO simulado, cuentas locales de
  prueba; sin tokens ni datos reales):
  - **Comprobante**: «Ver comprobante» abre el visor en la misma página (sin enlaces `target=_blank` en el hub ni en Salones y
    ciclos); una imagen de 600×1000 se muestra ajustada (300×499) y «Tamaño real» la deja a 600×1000 con desplazamiento; con una
    imagen inválida aparece «No se pudo cargar la imagen del comprobante» y el enlace a otra pestaña. El visor queda por encima del
    menú lateral del administrador (z 60 > 50). En 375 px: modal de 343 px, imagen 299×498, botones dentro de la pantalla y sin
    desplazamiento horizontal.
  - **Borradores** (estudiante): el hub muestra «+ Equipo adicional · S/ 20.00», la regla de adicionales y «Ya inscribiste tu salón o
    ciclo» (sin formulario). En el formulario: «← Volver a mi salón o ciclo», «Guardar borrador» (queda con `teamId` en la URL,
    título «Editar equipo» y aviso de borrador), recarga que restaura nombre, celular y jugadores, aviso «Cambios sin guardar» al
    volver con ediciones, y desde el hub «Editar · Enviar · Quitar»; «Enviar» lo deja «Pendiente» sin «Editar».
  - **DNI automático**: al buscar el código de un alumno el DNI aparece solo con la marca «Del padrón».
  - **Administrador**: filtro «Borradores»; «Editar equipo» agrega un jugador por código (con su DNI del padrón), conserva el
    capitán/a y el estado `PENDING`. Integraciones: la tarjeta «Padrón de estudiantes» muestra la URL, la máscara (••••WLcs) y
    «Funcionando» tras «Probar»; la API key no está en el DOM.
  - **Tesorero**: no tiene el filtro «Borradores» ni «Editar equipo»; ve «Ampliar comprobante» y las acciones de pago.
  - Mis datos de prueba (equipos `E2E-6…`) y la conexión local con API UNDC se borraron al terminar.
- **Pendiente**: móvil real (solo emulación de 375 px), el recorrido con Google, la transición de cierre de los modales (el panel de
  vista previa no pinta las animaciones; no cambió) y probar con API UNDC y SIVIRENO reales.
