---
description: "Lista de tareas de implementación — Revisión por salón o ciclo (frontend)"
---

# Tasks: Revisión por salón o ciclo — desplegables, panel de equipo y panel de pago (frontend)

**Input**: `specs/007-revision-por-salon/spec.md`. No depende de cambios del backend.

**Tests**: no hay pruebas automáticas de frontend; type-check, build y prueba manual en navegador contra la API local.

## Phase 1: Base

- [x] T001 `spec.md` y `tasks.md`
- [x] T002 `utils/groups.ts`: `groupTeamRows`, `coverageOf`, `groupAttention` y `ATTENTION_ORDER`
- [x] T003 Tema: tonos `oscuro-300/400/500` con contraste ≥ 4.5:1 (`assets/css/main.css`)
- [x] T004 Acentos rotos en `admin/inscripciones.vue` y `admin/disciplinas/index.vue`

## Phase 2: Componentes (US1–US3)

- [x] T005 `components/GroupAccordion.vue`: cabecera con estado, pack y equipos adicionales
- [x] T006 `components/AdminTeamEditForm.vue` (extraído de `AdminTeamEditModal`, que se elimina)
- [x] T007 `components/VoucherImage.vue`: ampliar el comprobante dentro del mismo modal
- [x] T008 `components/TeamReviewPane.vue`: solo el equipo, edición en el mismo panel, acciones por rol
- [x] T009 `components/PaymentReviewPane.vue`: comprobante y equipos que cubre

## Phase 3: Pantalla (US1–US4)

- [x] T010 `admin/inscripciones.vue`: un modal con dos paneles, desplegables, aviso de resultados y «Expandir/Contraer todo»
- [x] T011 Filtro de pago en el cliente con `needsVoucher` (el Tesorero ve los equipos que pagan por salón)
- [x] T011b Modal en el historial (`?revision=N`): «Atrás» vuelve al panel anterior y desde el primero cierra; botón ← visible en `AppModal` (`back-label`)

## Phase 4: Cierre

- [x] T012 `docs/api-consumption.md` y `AGENTS.md`
- [x] T013 `vue-tsc` sin errores nuevos y `bun run build`
- [x] T014 Recorrido en el navegador (Owner y Tesorero, escritorio y móvil) contra la API local; evidencia en la spec
- [x] T015 Commits pequeños en la rama e integración en `main` (el usuario lo pidió expresamente el 2026-10-14)
