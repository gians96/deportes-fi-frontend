# Feature Specification: Pago por salón o ciclo (frontend)

**Feature Branch**: `feat/pago-por-grupo`

**Created**: 2026-10-13

**Status**: Implementada (2026-10-13)

**Input**: Pantallas para la regla del evento deportivo: un voucher por pago de salón (S/100) o de
ciclo completo (S/150) que cubre un equipo por disciplina, y pago aparte por cada equipo adicional
en una misma disciplina (S/20 / S/30). Consume el contrato de
`backend/specs/002-pago-por-grupo/contracts/pagos-por-grupo.md`; el backend decide montos, cupos y
reglas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inscribir mi salón o ciclo con un solo pago (Priority: P1)

El delegado entra al evento y ve la invitación "Inscripción por salón o ciclo" con las tarifas.
En el hub **Mi salón o ciclo** elige salón o ciclo completo, escuela, ciclo y sección (texto libre),
adjunta **un** comprobante y envía.

**Independent Test**: en un evento `PER_GROUP`, crear un salón y comprobar que aparece con su pago
general `PENDIENTE` y la etiqueta normalizada ("Ingeniería de Sistemas · V · A1").

**Acceptance Scenarios**:

1. **Given** un evento `PER_GROUP` y una sesión de estudiante, **When** abre `/eventos/:id`, **Then**
   ve las cuatro tarifas, el botón "Inscribir mi salón o ciclo" y las disciplinas como "Incluido en el
   pago del salón".
2. **Given** el hub, **When** completa escuela, ciclo "5", sección "a-1" y el comprobante, **Then** el
   salón aparece como `V · A1` con el monto de la tarifa base y estado pendiente.
3. **Given** un salón o ciclo en conflicto (duplicado, ciclo completo vs salones), **When** envía,
   **Then** se muestra el mensaje del backend en español y no se crea nada.
4. **Given** un evento que no es `PER_GROUP`, **When** abre el hub, **Then** ve un aviso con enlace a
   las disciplinas.

### User Story 2 - Registrar los equipos sin volver a pagar (Priority: P1)

Desde el hub, "Registrar equipo" lleva a `/inscripcion/:disciplinaId?groupId=`. La pantalla toma
ciclo y sección del grupo, no pide comprobante para el primer equipo, exige capitán/a y DNI de 8
dígitos por jugador y, al terminar, vuelve al hub.

**Acceptance Scenarios**:

1. **Given** un grupo sin equipo en Futsal, **When** abre la pantalla, **Then** dice que el equipo
   está incluido en el pago general y no muestra ciclo, sección ni comprobante.
2. **Given** jugadores agregados, **When** falta el DNI o el capitán, **Then** muestra el error sin
   enviar. El primer jugador agregado queda como capitán/a hasta que se cambie.
3. **Given** una disciplina de un evento `PER_GROUP` abierta sin `groupId`, **When** carga, **Then**
   redirige al hub.
4. **Given** un evento por disciplina, **When** abre la inscripción, **Then** el flujo es el de siempre
   (ciclo, sección y comprobante por disciplina).

### User Story 3 - Equipo adicional con pago extra (Priority: P1)

Si el grupo ya tiene un equipo vigente en la disciplina, la pantalla indica que será adicional, muestra
la tarifa y pide un comprobante nuevo o permite sumarlo a un comprobante adicional pendiente.

### User Story 4 - Ver el estado y reenviar comprobantes rechazados (Priority: P2)

El hub y "Mis inscripciones" muestran el estado del pago general, de cada adicional y de cada equipo
(Incluido / Adicional). Un comprobante rechazado muestra el motivo y permite reenviar imagen y número
de operación sin recrear equipos.

### User Story 5 - Validar pagos de salones y ciclos desde el panel (Priority: P1)

El administrador entra a **Salones y ciclos**, filtra por escuela, ciclo o estado, valida el pago
general una sola vez (se aprueban los equipos válidos y se informan los omitidos con su motivo),
rechaza con motivo, valida adicionales y aprueba a mano los equipos que se sumaron después.

### User Story 6 - Configurar el cobro del evento (Priority: P2)

En Eventos → **Cobro**, el administrador elige "Por disciplina" o "Por salón o ciclo completo" y fija
las cuatro tarifas.

## Requirements *(mandatory)*

- **FR-001**: `SportEvent.pricingMode` decide el flujo; en `PER_DISCIPLINE` ninguna pantalla cambia.
- **FR-002**: Hub `pages/inscripcion/grupo/[eventId].vue`: tarifas, mis grupos con pago general,
  adicionales y equipos por disciplina, y formulario para crear un grupo (`POST /groups`, multipart).
- **FR-003**: `pages/inscripcion/[id].vue` en modo grupo: sin ciclo/sección; capitán/a y DNI por
  jugador; comprobante solo en adicionales (`voucher` o `extraVoucherId`); no se muestra nada de
  ciclo/sección hasta saber el modo del evento.
- **FR-004**: `GroupVoucherPanel` muestra monto, operación, imagen y motivo, y reenvía con
  `PATCH /vouchers/:id/replace` si está rechazado.
- **FR-005**: `admin/grupos.vue`: validar (`approvedTeamIds`/`skipped`), rechazar con motivo, aprobar
  equipos pendientes cuyo comprobante ya está validado.
- **FR-006**: `admin/eventos.vue`: modal "Cobro" con `GET/PUT /events/:id/pricing`.
- **FR-007**: En `estado-inscripcion.vue` y `admin/inscripciones.vue` los equipos de un grupo se tratan
  como "de pago" con el comprobante del grupo (`paysByGroup`), no por `discipline.isPaid`.
- **FR-008**: `useApi` gana `put` y `upload(path, formData, method)`; los errores se muestran con el
  mensaje del backend (`apiMessage`).
- **FR-009**: Texto de UI en español; sin secretos en el cliente; el frontend valida para la
  experiencia y el backend es la autoridad.

## Success Criteria

- **SC-001**: Un delegado crea su salón con un solo comprobante y registra los equipos de cada
  disciplina sin volver a pagar.
- **SC-002**: Los eventos por disciplina se inscriben igual que antes.
- **SC-003**: El administrador valida un pago de salón y los equipos válidos quedan aprobados en un
  solo paso.

## Fuera de alcance

Género por integrante, contador de cajas de agua, exportación de nómina, edición del salón después de
creado y reemplazo del delegado de un grupo.

## Evidencia de verificación (2026-10-13)

- `npx -p typescript@5.9.3 -p vue-tsc@3.3.13 vue-tsc -b --noEmit`: **10 errores, todos en los tres
  archivos con errores previos documentados** (`fixture.vue`, `nuxt.config.ts`, `utils/sports.ts`);
  ninguno en archivos de esta feature. `bun run build` sin errores.
- Prueba manual en el navegador, con el frontend compilado, la API real y una base MySQL temporal:
  1. `/eventos/1` (evento `PER_GROUP`): tarifas, botón y disciplinas "Incluido en el pago del salón".
  2. Hub: creación del salón con comprobante real → "Ingeniería de Sistemas · V · A1", pago de S/ 100
     pendiente.
  3. Inscripción de Futsal en modo grupo: sin ciclo/sección; error "Falta el DNI…" sin DNI; registro
     correcto y regreso al hub con "Los Bits · Incluido" y el botón "Agregar equipo adicional · S/ 20.00".
  4. Segunda inscripción en Futsal: indica "equipo adicional" y muestra el comprobante de S/ 20.
  5. Admin → Salones y ciclos: "Validar pago y aprobar equipos" → "Equipos aprobados: 1" y el equipo
     pasa a Aprobado.
  6. Admin → Eventos → Cobro: el modal carga modo y tarifas guardadas.
  7. "Mis inscripciones": el equipo muestra "Pago del salón o ciclo", "V - A1" y el enlace al hub.
  8. Regresión: un evento por disciplina conserva ciclo, sección y comprobante de S/ 25; una
     disciplina de un evento `PER_GROUP` sin `groupId` redirige al hub.
- **No verificado en pantalla**: envío del equipo adicional desde la interfaz (sí en la API), reenvío
  de un comprobante rechazado y el modal de rechazo del admin, vista móvil y el inicio de sesión con
  Google (la sesión se simuló con un token firmado localmente).
- Observación ajena a esta feature: los modales del admin (p. ej. Tokens API) quedan parcialmente
  tapados por el menú lateral a 1024 px de ancho; se dejó como tarea aparte.
