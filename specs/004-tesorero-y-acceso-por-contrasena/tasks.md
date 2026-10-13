---
description: "Lista de tareas de implementación — Tesorero y acceso por contraseña (frontend)"
---

# Tasks: Tesorero y acceso por contraseña (frontend)

**Input**: `specs/004-tesorero-y-acceso-por-contrasena/spec.md` y `backend/specs/004-tesorero-y-acceso-por-contrasena` (implementado)

**Tests**: no hay pruebas automáticas de frontend; type-check, build y prueba manual en navegador.

## Phase 1: Base

- [x] T001 `spec.md` y `tasks.md`
- [x] T002 Tipos (`Role`, `AuthUser`) y store (`isTreasurer`, `canValidatePayments`, `homePath`, `loginWithPassword`)
- [x] T003 `middleware/admin.ts`, `guest.ts`, `completar-perfil.vue`, `layouts/default.vue` y `layouts/admin.vue` (menú y rótulos de Tesorería)

## Phase 2: Pantallas

- [x] T004 `login.vue` con formulario de correo y contraseña
- [x] T005 `admin/usuarios.vue`: rol Tesorero, **Acceso**, contraseña (generar, copiar, cambiar, quitar) y columna «Acceso»
- [x] T006 `admin/inscripciones.vue`, `admin/grupos.vue` y `admin/dashboard.vue`: acciones del Tesorero limitadas a pagos

## Phase 3: Cierre

- [x] T007 `docs/api-consumption.md` y `AGENTS.md`
- [x] T008 Type-check sin errores nuevos y `bun run build`
- [x] T009 Prueba manual en el navegador contra el backend local (ver evidencia en `spec.md`)
- [ ] T010 Probar en pantalla la vista móvil del login y del modal de contraseña, y el rechazo de un comprobante como Tesorero
