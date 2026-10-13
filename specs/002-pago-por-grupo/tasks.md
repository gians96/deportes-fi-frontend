---
description: "Lista de tareas de implementación — Pago por salón o ciclo (frontend)"
---

# Tasks: Pago por salón o ciclo (frontend)

**Input**: `specs/002-pago-por-grupo/` y `backend/specs/002-pago-por-grupo` (implementado)

**Tests**: no hay pruebas automáticas de frontend; type-check, build y prueba manual en navegador.

## Phase 1: Base

- [x] T001 Escribir `spec.md`, `plan.md`, `contracts/api-consumo.md` y `tasks.md`
- [x] T002 Tipos del contrato en `app/types/domain.ts`; `put` y `upload(method)` en `app/composables/useApi.ts`
- [x] T003 `app/utils/groups.ts` (tarifas, cupos, `paysByGroup`, `apiMessage`, `uploadUrl`)

## Phase 2: Delegado (US1–US4)

- [x] T004 `GroupVoucherPanel.vue` (estado del comprobante y reenvío)
- [x] T005 Hub `pages/inscripcion/grupo/[eventId].vue` (tarifas, mis grupos, crear grupo)
- [x] T006 `pages/inscripcion/[id].vue` en modo grupo (capitán, DNI, adicional, redirección al hub)
- [x] T007 `eventos/[id].vue`, `DisciplineCard.vue` y `disciplinas/[id].vue` según el modo de cobro
- [x] T008 `estado-inscripcion.vue` con equipos de grupo

## Phase 3: Administración (US5–US6)

- [x] T009 `admin/grupos.vue` y entrada "Salones y ciclos" en `layouts/admin.vue`
- [x] T010 Modal "Cobro" en `admin/eventos.vue`
- [x] T011 `admin/inscripciones.vue`: los equipos de un grupo se tratan como de pago

## Phase 4: Cierre

- [x] T012 `docs/api-consumption.md` y `AGENTS.md`
- [x] T013 Type-check sin errores nuevos y `bun run build`
- [x] T014 Prueba manual en el navegador (ver evidencia en `spec.md`)
- [ ] T015 Probar en pantalla el reenvío de un comprobante rechazado, el modal de rechazo del admin y la vista móvil
