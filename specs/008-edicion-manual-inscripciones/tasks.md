# Tasks: Edición manual de inscripciones y estado «Observado» (frontend)

**Input**: `specs/008-edicion-manual-inscripciones/spec.md`. Depende de `backend/specs/007-edicion-manual-inscripciones`.

**Tests**: no hay pruebas automáticas de frontend; type-check, build y prueba manual en navegador contra la API local.

## Fase 1 — Base

- [x] T001 `types/domain.ts` (`OBSERVED`, `observation`), `StatusBadge`, `utils/groups.ts` (`isActiveGroup`, `groupAttention`)

## Fase 2 — Componentes (US1, US2)

- [x] T002 `components/TeamEditForm.vue` (renombrado desde `AdminTeamEditForm`): `adminMode`, `resubmit`, delegado, ciclo/sección, jugadores editables y «+ En blanco»
- [x] T003 `components/VoucherAdminActions.vue`: volver a pendiente y corregir N.° de operación y monto
- [x] T004 `components/TeamReviewPane.vue`: sección Administración (estado, observado, eliminar con confirmación en el panel)
- [x] T005 `components/PaymentReviewPane.vue`: acciones de administrador del comprobante

## Fase 3 — Pantallas (US1, US3, US4)

- [x] T006 `admin/inscripciones.vue`: pestaña «Observados», `changeStatus`, `deleteReview`, `reopenVoucher`, `editVoucher`, candidatos a delegado
- [x] T007 `GroupAccordion.vue` y `admin/grupos.vue`: contador de observados y aviso «Esperando al delegado»
- [x] T008 `estado-inscripcion.vue` e `inscripcion/grupo/[eventId].vue`: observación y «Corregir y reenviar»

## Fase 4 — Cierre

- [x] T009 `docs/api-consumption.md` y `AGENTS.md`
- [x] T010 `vue-tsc` sin errores nuevos y prueba manual en el navegador contra la API local; evidencia en la spec
- [x] T011 `bun run build` sin errores (Nuxt 4.4.7, build completo)
