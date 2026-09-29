# AGENTS.md — Frontend (deportes-fi)

Guía para agentes de IA y desarrolladores que trabajen en este repositorio.

## Qué es

App web (Nuxt 4 + Vue 3 + Tailwind 4) del Sistema de Deportes de la Facultad de
Ingeniería UNDC. Consume la API del backend (`/api/v1`). Documentación detallada
en [`docs/`](./docs/README.md).

## Entorno y comandos

- **Runtime / package manager**: Bun. Usa `bun install`, `bun run <script>`.
- **Shell del proyecto**: Windows PowerShell. Encadena con `;`, **no** con `&&`.
  Para fijar el directorio: `& { Set-Location 'ruta'; comando }`.
- Comandos:
  - Dev: `bun run dev` → `http://localhost:3000`.
  - Build: `bun run build` · Preview: `bun run preview`.
- Requiere el backend en `http://localhost:3001/api/v1` (o `NUXT_PUBLIC_API_BASE`).

## Arquitectura (resumen)

- Directorio `app/` (Nuxt 4). Ruteo basado en archivos en `app/pages/`.
- **Componentes y composables auto-importados**: no añadas `import` para
  `AppModal`, `AppConfirm`, `useApi`, `useFaculties`, `useAuthStore`, etc.
- Capas clave: `composables/useApi.ts` (HTTP), `stores/auth.ts` (sesión),
  `middleware/` (`auth`, `admin`, `guest`, `profile.global`), `layouts/` (`default`,
  `admin`), `types/domain.ts` (tipos compartidos).
- Detalle completo en [`docs/architecture.md`](./docs/architecture.md).

## Convenciones de código

- Siempre `<script setup lang="ts">` (Composition API). Nada de Options API.
- **Todo el acceso a la API pasa por `useApi()`** (`get/post/patch/del/upload`).
  No uses `$fetch`/`fetch` directo en páginas.
- Formularios y confirmaciones del panel usan `AppModal` / `AppConfirm`
  (no construir modales ad-hoc).
- Reutiliza la clase `.input` (definida en `<style scoped>` de cada página) para
  inputs/selects del panel.
- Iconos desde `lucide-vue-next`. Tema oscuro/neón, fuente Rajdhani; respeta los
  tokens de color `oscuro-*` y verdes existentes.
- Textos de UI en **español**.

## Reglas de UX/negocio a respetar

- El delegado responsable es `Team.delegateId`; no se guarda automáticamente como
  jugador. En creación manual admin/owner puede seleccionar `delegateId`.
- **No permitir integrantes duplicados** (validar por código/DNI antes de
  agregar) — aplica en `inscripcion/[id].vue` y `admin/inscripciones.vue`.
- En el panel admin, respetar permisos: `admin.ts` exige rol OWNER/ADMIN; en
  usuarios, un admin no edita admins/owners y nadie se inhabilita a sí mismo.
- Disciplinas pagadas (`isPaid`) requieren voucher en la inscripción.
- Tokens de integración por evento (`admin/eventos.vue` → "Tokens API"): el
  valor completo `dfi_…` solo se muestra una vez tras crearlo; nunca guardarlo
  en cookies, `localStorage`, stores ni consola.
- En `admin/inscripciones.vue`, mostrar siempre `team.phone` como teléfono de
  contacto del equipo/delegado; si falta, usar un texto discreto.

## Sesión

- El token vive en `useCookie('deportes_fi_token')` (SSR-friendly). La sesión se
  restaura en `plugins/auth.client.ts`. Un 401 desde `useApi` limpia la sesión.
- `middleware/guest.ts` redirige a usuarios autenticados que entren a `/login`
  hacia admin, completar perfil o inicio según corresponda.

## Antes de dar por terminado

1. `get_errors` limpio en los `.vue`/`.ts` tocados (sin errores TypeScript/Vue).
2. Verificar que el dev server (Nuxt) compile sin errores.
3. Si cambian endpoints consumidos, actualizar
   [`docs/api-consumption.md`](./docs/api-consumption.md).
4. Para probar login Google, recordar los orígenes JS autorizados en Google
   Cloud Console (ver `docs/deployment.md`).
