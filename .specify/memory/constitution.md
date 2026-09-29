# Constitución — Frontend Deportes FI (UNDC)

Principios no negociables de la app web del Sistema de Deportes de la Facultad de Ingeniería
(UNDC). Complementa `AGENTS.md` (guía operativa) y `docs/` (arquitectura y consumo de la API).

## Core Principles

### I. Un solo camino hacia la API

- Todo acceso al backend pasa por `useApi()` (`get/post/patch/del/upload`), que agrega el
  `Authorization: Bearer` desde la cookie `deportes_fi_token` y cierra la sesión ante un 401.
  No se usa `$fetch`/`fetch` directo en páginas ni componentes.
- Los tipos de las respuestas viven en `app/types/domain.ts` y MUST reflejar
  `backend/docs/api-contract.md`; si cambian los endpoints consumidos se actualiza
  `docs/api-consumption.md` en el mismo cambio.
- El backend es la autoridad: el frontend valida para la experiencia de uso, nunca como única
  barrera (permisos, plazos, duplicados, voucher).

### II. UI consistente con el panel existente

- Siempre `<script setup lang="ts">` (Composition API); componentes y composables
  auto-importados.
- Formularios y confirmaciones con `AppModal` / `AppConfirm`; nada de modales ad hoc.
- Tailwind 4 con los tokens `oscuro-*` y los verdes del tema oscuro/neón, fuente Rajdhani, clase
  `.input` local para campos del panel, iconos de `lucide-vue-next`.
- Todos los textos de UI en **español**; errores del backend mostrados desde
  `err.data.message`.

### III. Secretos fuera del navegador

- La sesión solo vive en la cookie `deportes_fi_token` (gestionada por `stores/auth.ts`).
- Los tokens de integración (`dfi_…`) se muestran **una sola vez** tras crearlos, con aviso
  explícito, y se descartan al cerrar el aviso o el modal: nunca se guardan en cookies,
  `localStorage`, Pinia ni se registran en consola.
- Las pantallas del panel respetan `middleware/admin.ts` (OWNER/ADMIN) y las reglas de rol del
  backend.

### IV. Cambios pequeños y trazables

- Flujo SDD con Spec Kit: `spec.md` → `plan.md` (+ `contracts/`) → `tasks.md` → implementación,
  en `specs/NNN-nombre/`.
- Se sigue el patrón de las páginas del panel (páginas autocontenidas en `app/pages/admin/`);
  no se reestructura código ajeno al feature.

## Stack y convenciones

- Nuxt 4.4 (SSR/Nitro), Vue 3.5, TypeScript, Pinia (`@pinia/nuxt`), Tailwind CSS 4
  (`@tailwindcss/vite`), Chart.js + vue-chartjs, TipTap, DOMPurify, lucide-vue-next.
- Gestor: **Bun** (`bun.lock`). Shell del proyecto: Windows PowerShell (encadenar con `;`).
- Configuración pública por `NUXT_PUBLIC_API_BASE` y `NUXT_PUBLIC_GOOGLE_CLIENT_ID`.
- Despliegue independiente con su `Dockerfile` (Dokploy).

## Flujo de trabajo y puertas de calidad

- Commits pequeños con Conventional Commits en español; nunca `git add -A`.
- **Definición de terminado**:
  1. `bun run build` sin errores.
  2. Sin errores de TypeScript/Vue en los archivos tocados (`vue-tsc --noEmit` sobre el
     proyecto; el repositorio no define script de type-check ni de lint).
  3. Verificación en el navegador contra un backend local cuando el cambio es de UI.
  4. `docs/api-consumption.md` actualizado si cambian los endpoints consumidos.
  5. Tareas marcadas en `tasks.md`.

## Governance

- Esta constitución prevalece sobre prácticas ad hoc; `AGENTS.md` es la guía operativa diaria y
  no puede contradecirla.
- Enmiendas: cambio en este archivo con justificación en el commit; versionado semántico
  (MAJOR: se elimina o redefine un principio; MINOR: principio o sección nueva; PATCH:
  redacción).
- Cada `plan.md` incluye una verificación explícita contra estos principios.

**Version**: 1.0.0 | **Ratified**: 2026-09-29 | **Last Amended**: 2026-09-29
