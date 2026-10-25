# Feature Specification: Edición manual de inscripciones y estado «Observado» (frontend)

**Feature Branch**: `feat/edicion-manual-inscripciones`

**Created**: 2026-10-24

**Status**: Implementada (2026-10-25)

**Input**: «En Admin → Inscripciones quiero poder editar toda esa inscripción manualmente: di en aprobar cuando me equivoqué;
poder eliminar, editar, modificar todos los parámetros, o marcarla como observada o según el estado que sea, para que el equipo
pueda volver a modificar.»

**Depende de**: `backend/specs/007-edicion-manual-inscripciones` (`PATCH /registrations/:id/status`, `OBSERVED`/`observation`,
`PATCH /vouchers/:id/reopen`, `PATCH /vouchers/:id`, `DELETE` de cualquier estado, campos solo-staff de `PATCH /registrations/:id`).
El backend decide permisos y reglas; aquí solo se muestran.

## Decisiones (confirmadas con el usuario)

1. Alcance: datos del equipo, nómina, estado y datos del comprobante (no mover de disciplina ni de salón).
2. Un equipo observado se corrige y reenvía sin plazo.
3. Eliminar es definitivo, con confirmación; el servidor lo bloquea si el equipo ya está en el fixture.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Corregir un estado equivocado desde el panel del equipo (Priority: P1)

En Admin → Equipos, al abrir un equipo **en cualquier estado** (Owner y Administrador), el panel muestra **Administración**:
«Volver a pendiente», «Marcar observado» (pide la observación), «Cambiar estado a…» (Pendiente, Aprobado, Rechazado, Observado,
Cancelado; Rechazado y Observado piden motivo) y «Eliminar inscripción» con confirmación dentro del panel (no se apilan modales).
Tras la acción el modal se cierra y un aviso dice en qué estado quedó el equipo.

### User Story 2 - Editar todos los parámetros (Priority: P1)

«Editar equipo» abre `TeamEditForm` en modo administrador: nombre, celular, delegado, ciclo y sección (solo equipos fuera de un
salón o ciclo) y, por jugador, nombre, código, DNI, género y capitán; permite agregar por padrón o **en blanco** y quitar. En el
comprobante (`VoucherAdminActions`): «Volver a pendiente» (deshace validar/rechazar; los equipos aprobados con él vuelven a
pendiente) y «Corregir N.° de operación y monto».

### User Story 3 - El delegado corrige un equipo observado (Priority: P1)

En «Mis inscripciones» y en el hub del salón, un equipo **Observado** muestra la observación y «Corregir y reenviar»: edita nombre,
celular y nómina (`TeamEditForm` con `resubmit`) y «Guardar y reenviar» lo devuelve a Pendiente, aunque el plazo o el evento estén
cerrados. «Guardar sin reenviar» conserva el estado. Si guardar funciona pero reenviar falla, el motivo se muestra sin perder lo editado.

### User Story 4 - Ver los observados (Priority: P2)

Pestaña «Observados» en el panel y en «Mis inscripciones»; insignia naranja en `StatusBadge`; en el desplegable del salón, contador
«N observados» y aviso «Esperando al delegado»; `isActiveGroup` los cuenta como equipos vivos.

## Requirements

- **FR-001** Tipos: `RegistrationStatus` + `OBSERVED`, `Team.observation`, `GroupTeam.observation`.
- **FR-002** `TeamEditForm` reemplaza a `AdminTeamEditForm` (modos `adminMode` y `resubmit`); `useRosterSearch` se comparte.
- **FR-003** Sección Administración de `TeamReviewPane`; `VoucherAdminActions` en `TeamReviewPane` y `PaymentReviewPane`.
- **FR-004** Delegado: `estado-inscripcion.vue` e `inscripcion/grupo/[eventId].vue`.
- **FR-005** `docs/api-consumption.md` y `AGENTS.md` actualizados.

## Evidencia de verificación (2026-10-25)

- `bun run build` sin errores (Nuxt 4.4.7).
- `vue-tsc` (TypeScript 5.9 / vue-tsc 3.1): sin errores nuevos; solo los previos de `fixture.vue`, `utils/sports.ts` y `nuxt.config.ts`.
- Navegador integrado contra backend local (:3030, MariaDB Docker :3311) con cuentas de prueba locales:
  - Admin: «Volver a pendiente» sobre un equipo aprobado (el comprobante sigue validado), edición de nombre desde `TeamEditForm`,
    «Marcar observado» con texto, corrección del monto del pack (S/ 100 → S/ 95.50) con el panel abierto, pestaña y contador de observados.
  - Delegado (plazo y evento cerrados en la base local): «Corregir y reenviar» → el equipo pasó a Pendiente con el DNI corregido y la
    observación limpia; el hub del salón muestra el equipo observado con su botón.
