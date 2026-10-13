---
description: "Lista de tareas de implementación — Comprobante en modal, borradores, DNI automático y API_UNDC (frontend)"
---

# Tasks: Comprobante en modal, borradores editables, DNI automático y conexión con API_UNDC (frontend)

**Input**: `specs/006-borradores-comprobante-dni/spec.md` y `backend/specs/006-borradores-edicion-dni-automatico` (implementado)

**Tests**: no hay pruebas automáticas de frontend; type-check, build y prueba manual en navegador contra la API local.

## Phase 1: Base

- [x] T001 `spec.md` y `tasks.md`
- [x] T002 Tipos (`DRAFT`, `draftCount`, `rejectionReason`, conexión con API_UNDC) y `StatusBadge` «Borrador»
- [x] T003 `VoucherViewerModal.vue` + `VoucherLink.vue`; `AppModal` por encima del menú lateral

## Phase 2: Pantallas del delegado (US1–US4)

- [x] T004 `GroupVoucherPanel`, hub y `estado-inscripcion` con el visor de comprobantes
- [x] T005 Hub: estados, «Editar / Enviar / Quitar», regla de adicionales y un salón por estudiante
- [x] T006 `composables/useRosterSearch.ts` (búsqueda compartida, DNI del padrón)
- [x] T007 `inscripcion/[id].vue`: «Volver», «Guardar borrador», «Enviar», modo edición y aviso de cambios sin guardar

## Phase 3: Administración (US1, US5, US6)

- [x] T008 `components/AdminTeamEditModal.vue` y su uso en `admin/inscripciones.vue` (+ filtro «Borradores» y visor)
- [x] T009 `admin/grupos.vue`: visor, borradores y «Validar» desactivado sin equipos enviados
- [x] T010 `components/UndcApiCard.vue` en `admin/integraciones.vue`

## Phase 4: Cierre

- [x] T011 `docs/api-consumption.md` y `AGENTS.md`
- [x] T012 `vue-tsc` sin errores nuevos y `bun run build`
- [x] T013 Recorrido en el navegador (escritorio y móvil) contra la API local; evidencia en la spec
