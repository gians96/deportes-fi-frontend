---
description: "Lista de tareas de implementación — Pantalla de proveedores de DNI (frontend)"
---

# Tasks: Pantalla de proveedores de DNI (frontend)

**Input**: `specs/003-proveedores-dni/` y `backend/specs/003-proveedores-dni` (implementado)

**Tests**: no hay pruebas automáticas de frontend; type-check, build y prueba manual en navegador.

## Phase 1: Base

- [x] T001 Escribir `spec.md` y `tasks.md`
- [x] T002 Tipos del contrato en `app/types/domain.ts`
- [x] T003 Entrada "Integraciones" en `app/layouts/admin.vue`

## Phase 2: Pantalla (US1–US2)

- [x] T004 `app/pages/admin/integraciones.vue`: tarjetas por proveedor, estado, máscara y aviso de clave
- [x] T005 Guardar token / URL / prioridad / activación (token solo si se escribió)
- [x] T006 Quitar token con `AppConfirm`
- [x] T007 Probar con un DNI de 8 dígitos (sin datos personales en pantalla)

## Phase 3: Cierre

- [x] T008 `docs/api-consumption.md` y `AGENTS.md`
- [x] T009 Type-check sin errores nuevos y `bun run build`
- [x] T010 Prueba manual en el navegador contra el backend local (ver evidencia en `spec.md`)
- [ ] T011 Probar en pantalla la vista móvil y el chip "Token rechazado" con un proveedor que responde 401
