# Implementation Plan: Gestión de tokens API por evento

**Branch**: `feat/tokens-evento` | **Date**: 2026-09-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-gestion-tokens-evento/spec.md`

## Summary

Agregar en `app/pages/admin/eventos.vue` una acción "Tokens API" por evento que abre un
`AppModal` con: formulario de creación (nombre + fecha de expiración opcional), aviso de un solo
uso con el token completo y botón de copiar, y tabla de tokens con estado; la revocación usa
`AppConfirm`. Todo vía `useApi()` y tipos nuevos en `app/types/domain.ts`. Contrato consumido en
[contracts/api-tokens-consumo.md](./contracts/api-tokens-consumo.md).

## Technical Context

**Language/Version**: TypeScript + Vue 3.5 SFC (`<script setup lang="ts">`) sobre Nuxt 4.4.

**Primary Dependencies**: Nuxt, Pinia (sesión), Tailwind CSS 4, lucide-vue-next. Sin
dependencias nuevas.

**Storage**: ninguno en el cliente (el token en claro vive solo en un `ref` mientras se muestra).

**Testing**: el repo no tiene pruebas de frontend; verificación con `bun run build`,
`vue-tsc --noEmit` (vía `nuxi typecheck`) y prueba manual en el navegador contra el backend
local (`http://localhost:3030/api/v1`).

**Target Platform**: navegadores modernos (panel admin, escritorio y móvil).

**Project Type**: web-app (Nuxt SSR).

**Performance Goals**: el modal carga la lista con una sola llamada; sin recargar la página de
eventos.

**Constraints**: token visible una sola vez; nada de persistencia; textos en español; estilo del
panel (tokens `oscuro-*`, verdes, `.input`).

**Scale/Scope**: pocos tokens por evento; una página modificada y un archivo de tipos.

## Constitution Check

| Principio | Verificación | Estado |
| --- | --- | --- |
| I. Un solo camino hacia la API | `useApi().get/post/del`; tipos en `domain.ts`; `docs/api-consumption.md` actualizado | ✅ |
| II. UI consistente | `AppModal` + `AppConfirm`, `.input`, iconos lucide, badges como en `usuarios.vue` | ✅ |
| III. Secretos fuera del navegador | Token solo en un `ref`, se borra al descartar/cerrar; sin storage ni logs | ✅ |
| IV. Cambios pequeños | Solo `eventos.vue`, `domain.ts` y docs | ✅ |

## Project Structure

### Documentation (this feature)

```text
specs/001-gestion-tokens-evento/
├── spec.md
├── plan.md
├── quickstart.md
├── contracts/api-tokens-consumo.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code

```text
app/
├── pages/admin/eventos.vue   # acción "Tokens API", modal de gestión y confirmación de revocación
└── types/domain.ts           # EventApiTokenStatus, EventApiToken, CreatedEventApiToken
docs/api-consumption.md       # endpoints consumidos por admin/eventos.vue
AGENTS.md                     # regla: tokens de integración solo se muestran una vez
```

**Structure Decision**: se sigue el patrón de las páginas del panel (modales en la misma página,
estado local con `ref`/`reactive`), sin componentes nuevos.

## Diseño de la interacción

- **Apertura**: `openTokens(event)` reinicia el estado, guarda el evento y llama
  `GET /events/:id/api-tokens`.
- **Creación**: `POST /events/:id/api-tokens` con `{ name, expiresAt? }`. La fecha del
  `<input type="date">` (mínimo: hoy) se convierte a fin del día local
  (`new Date('YYYY-MM-DDT23:59:59.999')` → ISO). Botón deshabilitado mientras procesa.
- **Aviso de un solo uso**: panel ámbar con el token en un campo de solo lectura, botón
  "Copiar" (`navigator.clipboard.writeText`; si falla, selecciona el texto y pide copiar
  manualmente), advertencia "Cópialo ahora, no se volverá a mostrar." y botón "Ya lo guardé"
  que borra el valor. Un `watch` sobre la visibilidad del modal borra el valor al cerrarlo.
- **Lista**: tabla con nombre, prefijo (`dfi_xxxxxxxx…`), creado, último uso ("Nunca"), vence
  ("Sin expiración") y estado del servidor (`ACTIVE`/`REVOKED`/`EXPIRED` → Activo verde,
  Revocado rojo, Expirado gris). Acción "Revocar" solo en activos/expirados no revocados.
- **Revocación**: `AppConfirm` (declarado después del modal para quedar encima) →
  `DELETE /events/:id/api-tokens/:tokenId` → reemplaza el elemento en la lista.
- **Errores**: `err.data.message` (string o arreglo) con respaldo en español.

## Complexity Tracking

No aplica.
