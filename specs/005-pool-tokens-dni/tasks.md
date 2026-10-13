---
description: "Lista de tareas de implementación — Pantalla de consultas de DNI, pool de tokens (frontend)"
---

# Tasks: Pantalla de consultas de DNI, pool de tokens (frontend)

**Input**: `specs/005-pool-tokens-dni/spec.md` y `backend/specs/005-pool-tokens-dni` (implementado)

**Tests**: no hay pruebas automáticas de frontend; type-check, build y prueba manual en navegador.

## Phase 1: Base

- [x] T001 `spec.md` y `tasks.md`
- [x] T002 Tipos del pool en `app/types/domain.ts` (reemplazan los de la spec 003)
- [x] T003 `app/components/DniUsageChart.client.vue` (barras apiladas con `vue-chartjs`)

## Phase 2: Pantalla (US1–US3)

- [x] T004 `admin/integraciones.vue`: tarjetas, avisos, tabla de tokens y acciones (probar, reiniciar, pausar, editar, eliminar)
- [x] T005 Formulario de alta y edición (token solo si se escribe, URL vacía = oficial)
- [x] T006 Consulta manual, vaciar caché y bitácora paginada

## Phase 3: Cierre

- [x] T007 `docs/api-consumption.md` y `AGENTS.md`; la spec 003 queda «reemplazada»
- [x] T008 Type-check sin errores nuevos y `bun run build`
- [x] T009 Prueba manual en el navegador contra el backend local (ver evidencia en `spec.md`)
- [ ] T010 Probar la vista móvil y con proveedores reales
