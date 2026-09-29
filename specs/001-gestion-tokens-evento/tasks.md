---
description: "Lista de tareas de implementación — Gestión de tokens API por evento"
---

# Tasks: Gestión de tokens API por evento

**Input**: documentos de `specs/001-gestion-tokens-evento/`

**Prerequisites**: plan.md, spec.md, contracts/api-tokens-consumo.md; backend con
`/events/:eventId/api-tokens`.

**Tests**: el repositorio no tiene pruebas automáticas de frontend; se verifica con build,
type-check y prueba manual en el navegador (quickstart.md).

## Format: `[ID] [P?] [Story] Descripción`

## Phase 1: Setup

- [x] T001 Agregar andamiaje de Spec Kit y completar `.specify/memory/constitution.md`
- [x] T002 Escribir `spec.md`, `plan.md`, `contracts/api-tokens-consumo.md`, `quickstart.md` y `checklists/requirements.md`

---

## Phase 2: Foundational

- [x] T003 [P] Agregar `EventApiTokenStatus`, `EventApiToken` y `CreatedEventApiToken` en `app/types/domain.ts`

---

## Phase 3: User Story 2 - Ver tokens y estado (P1)

- [x] T004 [US2] Acción "Tokens API" por evento y `AppModal` con carga de `GET /events/:id/api-tokens` en `app/pages/admin/eventos.vue`
- [x] T005 [US2] Tabla con nombre, prefijo, creado, último uso, vence y estado (badges Activo/Revocado/Expirado), estado vacío y error con reintento

---

## Phase 4: User Story 1 - Crear y copiar una sola vez (P1) 🎯 MVP

- [x] T006 [US1] Formulario (nombre ≤ 100, fecha opcional con mínimo hoy → fin del día local en ISO) con `POST /events/:id/api-tokens`
- [x] T007 [US1] Aviso de un solo uso: token en campo de solo lectura, botón "Copiar" con respaldo manual, advertencia "Cópialo ahora, no se volverá a mostrar." y "Ya lo guardé"
- [x] T008 [US1] Borrar el token en claro al descartar, al cerrar el modal y al cambiar de evento (sin storage ni logs)

---

## Phase 5: User Story 3 - Revocar con confirmación (P2)

- [x] T009 [US3] `AppConfirm` de revocación con `DELETE /events/:id/api-tokens/:tokenId` y actualización de la fila

---

## Phase 6: Polish & Cross-Cutting

- [x] T010 [P] Actualizar `docs/api-consumption.md` y `AGENTS.md`
- [x] T011 `bun run build` sin errores y `vue-tsc -b --noEmit` (efímero vía `npx`) sin errores en los archivos tocados
- [x] T012 Prueba manual en el navegador contra el backend local (quickstart.md)
- [x] T013 Marcar la spec como implementada

## Dependencies & Execution Order

T003 → T004/T005 → T006–T008 → T009 → Polish. US2 va primero porque el modal y la lista son la
base donde viven la creación (US1) y la revocación (US3).

## Evidencia de verificación (2026-09-29)

- `bun run build`: sin errores (solo advertencias previas de sourcemaps y `DEP0155`).
- `vue-tsc -b --noEmit`: 0 errores en `app/pages/admin/eventos.vue` y `app/types/domain.ts`
  (un control negativo confirmó que la página sí se verifica). Hay 10 errores previos en
  archivos no tocados: `admin/disciplinas/[id]/fixture.vue` (7), `nuxt.config.ts` (2, `process`
  sin tipos de Node) y `utils/sports.ts` (1).
- Prueba manual en el navegador (Nuxt dev en `:3002` → backend local `:3030`, sesión OWNER de
  prueba): listado con estados Activo/Revocado/Expirado, creación con vencimiento (fin del día
  local), aviso de un solo uso con "Copiar" → "Copiado", "Ya lo guardé" elimina el token del
  DOM, el token no aparece en cookies/`localStorage`/`sessionStorage`, error de validación del
  servidor mostrado en español, revocación con confirmación → "Revocado" y la integración con ese
  token responde 401. Todas las llamadas fueron al backend local.
- Revisión final: una fecha ilegible ya no crea un token sin expiración (build y vue-tsc
  repetidos en verde).
- Observación previa (fuera de alcance): en anchos menores a `lg`, la barra inferior del layout
  admin (`z-50`) queda por encima de cualquier `AppModal` (`z-50`).
