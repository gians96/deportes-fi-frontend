# AGENTS.md — Frontend (deportes-fi)

Guía para agentes de IA y desarrolladores que trabajen en este repositorio.

## Qué es

App web (Nuxt 4 + Vue 3 + Tailwind 4) del Sistema de Deportes de la Facultad de
Ingeniería UNDC. Consume la API del backend (`/api/v1`). Documentación detallada
en [`docs/`](./docs/README.md). Principios no negociables en
[`.specify/memory/constitution.md`](./.specify/memory/constitution.md).

En el ecosistema es donde un administrador genera los **tokens de integración por evento**
(Admin → Eventos → «Tokens API») que el congreso usa para la "Semana Sistémica" (Contrato 2).
No llama a otros sistemas: solo a su backend y a Google Identity.

## Entorno y comandos

- **Runtime / package manager**: Bun. Usa `bun install`, `bun run <script>`.
- **Shell del proyecto**: Windows PowerShell. Encadena con `;`, **no** con `&&`.
  Para fijar el directorio: `& { Set-Location 'ruta'; comando }`.
- Comandos:
  - Dev: `bun run dev` → `http://localhost:3000`.
  - Build: `bun run build` · Preview: `bun run preview`.
  - Tipos: el repositorio no define scripts de type-check ni de lint; usa
    `npx vue-tsc -b --noEmit` (efímero). Hay errores previos en archivos no relacionados
    (`admin/disciplinas/[id]/fixture.vue`, `nuxt.config.ts`, `utils/sports.ts`): no agregues
    nuevos.
- Requiere el backend en `http://localhost:3001/api/v1` (o `NUXT_PUBLIC_API_BASE`).
- **Ecosistema local**: el backend corre en 3030 y los puertos 3000/3001 los usan la landing y el
  panel del congreso. Ejemplo:
  `$env:NUXT_PUBLIC_API_BASE = 'http://localhost:3030/api/v1'; $env:PORT = '3002'; bun run dev`,
  agregando `http://localhost:3002` a `CORS_ORIGIN` del backend.
- Variables: `NUXT_PUBLIC_API_BASE` (sin `/` final) y `NUXT_PUBLIC_GOOGLE_CLIENT_ID` (el mismo
  Client ID que el backend). Son públicas: nunca pongas secretos en `NUXT_PUBLIC_*`.
- **Docker**: build con Bun y runtime Node 22 alpine, puerto 3000 (ver
  [`docs/deployment.md`](./docs/deployment.md)).

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
- Los tipos de `app/types/domain.ts` reflejan `backend/docs/api-contract.md`; los errores del
  backend se muestran desde `err.data.message`.

## Reglas de UX/negocio a respetar

- El delegado responsable es `Team.delegateId`; no se guarda automáticamente como
  jugador. En creación manual admin/owner puede seleccionar `delegateId`.
- **No permitir integrantes duplicados** (validar por código/DNI antes de
  agregar) — aplica en `inscripcion/[id].vue` y `admin/inscripciones.vue`.
- En el panel admin, respetar permisos: `admin.ts` exige rol OWNER/ADMIN; en
  usuarios, un admin no edita admins/owners y nadie se inhabilita a sí mismo.
- Disciplinas pagadas (`isPaid`) requieren voucher en la inscripción.
- Roles del panel (spec 004): `OWNER_SYSTEM` y `ADMIN_SYSTEM` gestionan todo (solo el Owner asigna Administrador u
  Owner); `TREASURER` (Tesorero) solo ve y valida pagos: entra a `/admin/dashboard`, `/admin/inscripciones` y
  `/admin/grupos` (`middleware/admin.ts`), no ve usuarios, eventos ni integraciones, y en esas pantallas no aprueba
  ni rechaza equipos ni crea equipos (solo valida o rechaza comprobantes). `auth.homePath` decide a dónde va cada rol.
  El servidor es quien manda: ocultar un botón no sustituye al permiso del backend.
- Acceso por contraseña (spec 004): la contraseña solo se escribe en un `input` (con «Mostrar», «Generar» y «Copiar» en
  el panel de usuarios) y se envía una vez; **nunca** se guarda en cookies, `localStorage`, stores ni consola, y el
  campo se vacía tras enviar. El formulario de `login.vue` y el modal de contraseña no repiten el valor en la pantalla.
- Proveedores de DNI (`admin/integraciones.vue`, spec 003): Decolecta y API Perú se configuran desde el
  panel y viven en la base de datos del backend, no en variables de entorno. El token se escribe en
  un campo `password`, se envía una vez y **nunca** se guarda en cookies, `localStorage`, stores ni
  consola; la pantalla solo muestra la máscara (`••••abcd`) que devuelve la API.
- Eventos con cobro por salón o ciclo (`SportEvent.pricingMode = PER_GROUP`, spec 002): el delegado
  entra por el hub `inscripcion/grupo/[eventId].vue`, paga **una vez** el pago general y registra los
  equipos de cada disciplina con `/inscripcion/:disciplineId?groupId=`; el primer equipo por
  disciplina no lleva voucher y los adicionales sí. Capitán/a y DNI son obligatorios; ciclo y
  sección son texto libre (el servidor los normaliza). Los montos y los cupos los decide el backend;
  la pantalla solo los muestra. Los equipos de un grupo se tratan como "de pago" con el comprobante
  del grupo (`paysByGroup` en `utils/groups.ts`), no por `discipline.isPaid`.
- Tokens de integración por evento (`admin/eventos.vue` → "Tokens API"): el
  valor completo `dfi_…` solo se muestra una vez tras crearlo; nunca guardarlo
  en cookies, `localStorage`, stores ni consola.
- En `admin/inscripciones.vue`, mostrar siempre `team.phone` como teléfono de
  contacto del equipo/delegado; si falta, usar un texto discreto.
- Más sobre "Tokens API": el aviso de un solo uso tiene "Copiar" (con selección manual si el
  portapapeles falla) y "Ya lo guardé", que descarta el token; la fecha de expiración vence al
  final de ese día (hora local) y una fecha ilegible nunca crea un token sin expiración; revocar
  pide confirmación con `AppConfirm` y es irreversible (las integraciones que lo usen reciben 401
  de inmediato).

## Sesión

- El token vive en `useCookie('deportes_fi_token')` (SSR-friendly). La sesión se
  restaura en `plugins/auth.client.ts`. Un 401 desde `useApi` limpia la sesión.
- `middleware/guest.ts` redirige a usuarios autenticados que entren a `/login`
  hacia admin, completar perfil o inicio según corresponda.

## Seguridad

- Nunca comitees `.env` (está en `.gitignore`); plantilla en `.env.example`.
- Los tokens `dfi_…` y el JWT nunca van a `localStorage`, `sessionStorage`, Pinia ni consola; la
  sesión solo vive en la cookie `deportes_fi_token`.
- El frontend valida para la experiencia de uso; la autoridad es el backend (permisos, plazos,
  duplicados, voucher).

## Ecosistema y comunicación entre sistemas

Este repositorio es parte del ecosistema de la Facultad de Ingeniería (UNDC). La fuente de
verdad de los contratos entre sistemas es
`backend-ciisic/docs/arquitectura-ecosistema.md` (contratos 1 a 5).

### Papel del frontend de deportes-fi

- **Expone**: solo interfaz; no tiene API propia.
- **Consume**: el backend de deportes-fi (`/api/v1`, JWT de Google en `Authorization: Bearer`)
  y Google Identity.
- **En el Contrato 2**: aquí se crean, listan y revocan los tokens por evento
  (`/events/:eventId/api-tokens`); un administrador del congreso los registra en su panel
  (Eventos → Integraciones) junto con la URL base del backend (`https://<host>/api/v1`) y
  `backend-ciisic` los usa servidor a servidor contra `/integrations/event/*`. El frontend nunca
  llama a esos endpoints. Resumen en
  [`docs/README.md`](./docs/README.md#integración-con-el-congreso-semana-sistémica).

### Mapa del ecosistema

| Sistema | Repositorio | Rol | Expone | Consume |
|---|---|---|---|---|
| API del congreso | `gians96/backend-ciisic` | Eventos, inscripciones, credenciales, DNI, verificación, Google, portal | API admin (JWT admin), `/api/v1/site/*` (token de acceso del evento), `/api/v1/me/*` (JWT de inscrito), `/api/v1/auth/*` | API_UNDC, deportes-fi, Decolecta/apiperu, Brevo, Google |
| Panel del congreso | `gians96/administrator-ciisic-frontend` | Administración + portal "Mis inscripciones" | UI (BFF Nitro) | backend-ciisic (vía BFF, cookie httpOnly → Bearer) |
| Landing del evento | `gians96/ciisic-undc-web` | Sitio público e inscripción | UI (SSR + BFF Nitro) | backend-ciisic `/api/v1/site/*` con el token del evento, solo desde su servidor |
| API UNDC | `API_UNDC` | Datos académicos (SIVIRENO, horarios…) | `POST /externo/estudiantes/verificar` (`X-API-Key` con scope `estudiantes:verificar`) | SIVIRENO, API Perú |
| SIGENET | `app-web-sigenet` | Frontend administrativo de API_UNDC | UI (pestaña Clientes API) | API_UNDC |
| **Deportes FI (este repositorio: frontend)** | `deportes-fi/backend` + `deportes-fi/frontend` | Inscripción de equipos y pagos | `GET /api/v1/integrations/event/*` (`X-Api-Key` = token por evento) | — |

Flujos entre sistemas:

1. **Verificación de estudiantes** (contrato 1): backend-ciisic → API_UNDC con una API key
   creada en SIGENET → Clientes API. La URL y la key se configuran en el panel del congreso
   (Sistema), no en variables de entorno.
2. **Semana Sistémica** (contrato 2): backend-ciisic → deportes-fi con un token por evento
   generado en deportes-fi (Eventos → Tokens API) y registrado en el panel del congreso
   (Eventos → Integraciones).
3. **Landing ↔ backend** (contrato 3): la landing llama a `/api/v1/site/*` desde su servidor
   con el token de acceso del evento (panel → Eventos → Acceso).
4. **Panel ↔ backend** (contrato 4): el BFF del panel agrega el Bearer desde una cookie httpOnly.
5. **Google y portal** (contrato 5): el panel y la landing usan el client ID guardado en el
   backend (Sistema); el backend verifica los ID tokens.

Puertos locales (desarrollo): landing 3000 · panel 3001 · backend-ciisic 3010 · API_UNDC 3020 ·
deportes-fi backend 3030 (con `PORT=3030`; su valor por defecto choca con el panel).
MySQL en Docker `ciisic-mysql` :3310 (BD `ciisic_vii`, `jp`) y MariaDB `deportes-mariadb` :3311.

### Protocolo de cambio de contrato

1. El cambio empieza en el repositorio **proveedor** con una spec (`specs/NNN-*/`) que incluye
   `contracts/`.
2. Se actualiza `backend-ciisic/docs/arquitectura-ecosistema.md` si afecta a otro sistema.
3. Cambios compatibles hacia atrás; si no es posible, se versiona o se mantiene un alias
   temporal (como las rutas legacy del congreso) y se retira cuando el consumidor migró.
4. El consumidor se actualiza en **su propio** repositorio y rama.
5. Se hace una prueba integrada local con los dos sistemas levantados antes de desplegar.

Este frontend consume su backend: si un cambio de pantalla necesita otro endpoint, se especifica
e implementa primero en `backend/` y aquí se actualizan `specs/*/contracts/` y
[`docs/api-consumption.md`](./docs/api-consumption.md).

### Trabajo con agentes de IA (varias sesiones en paralelo)

- **Un agente por repositorio a la vez.** Antes de empezar: `git status` y `git log --oneline -10`.
  Si hay cambios sin comitear que no son tuyos, detente y coordina; no los mezcles ni los descartes.
- **No modifiques otros repositorios.** Si un cambio requiere al otro sistema, documenta el
  contrato y pide el cambio a quien trabaja en ese repositorio.
- **Git**: ramas `feat/*`; `git add <rutas explícitas>` (nunca `-A` ni `.`); commits pequeños con
  mensajes convencionales en español; **no** hagas push, merge ni despliegues sin confirmación
  humana; nunca reescribas historia publicada.
- **Secretos**: nunca en el repositorio ni en los reportes; `.env` fuera de git; producción solo
  con permiso explícito y empezando por un respaldo de solo lectura.
- **Al terminar**, deja un reporte: commits (hash y mensaje), pruebas ejecutadas y resultado,
  cambios de contrato y pendientes.

`backend/` y `frontend/` son repositorios git independientes: trabaja en uno a la vez y no
toques archivos de la carpeta padre `deportes-fi/`.

## SDD con Spec Kit

- Constitución: [`.specify/memory/constitution.md`](./.specify/memory/constitution.md)
  (prevalece sobre prácticas ad hoc; esta guía no puede contradecirla). Cada `plan.md` incluye su
  verificación contra ella.
- Cada feature vive en `specs/NNN-nombre/` (numeración secuencial):
  1. `spec.md`: historias priorizadas, escenarios Given/When/Then, requisitos `FR-xxx`, casos
     límite y criterios de éxito (+ `checklists/requirements.md`).
  2. `plan.md`: diseño; `contracts/*.md` con los endpoints consumidos y `quickstart.md` para la
     verificación en el navegador.
  3. `tasks.md`: tareas con casillas `- [ ]` por fases e historias.
  4. Implementación en commits pequeños: marca cada tarea `- [x]` al terminarla, cierra con la
     "Evidencia de verificación" y cambia el estado de la spec a "Implementada".
- En Claude Code: `/speckit-specify` → `/speckit-clarify` → `/speckit-plan` → `/speckit-tasks` →
  `/speckit-analyze` → `/speckit-implement` (`/speckit-converge` agrega lo que falte). Los scripts
  están en `.specify/scripts/powershell/`.
- Specs: `001-gestion-tokens-evento` (depende de `backend/specs/001-tokens-api-por-evento`), `002-pago-por-grupo` (depende de `backend/specs/002-pago-por-grupo`), `003-proveedores-dni` (depende de `backend/specs/003-proveedores-dni`), `004-tesorero-y-acceso-por-contrasena` (depende de `backend/specs/004-tesorero-y-acceso-por-contrasena`).

## Antes de dar por terminado

1. `get_errors` limpio en los `.vue`/`.ts` tocados (sin errores TypeScript/Vue).
2. Verificar que el dev server (Nuxt) compile sin errores.
3. Si cambian endpoints consumidos, actualizar
   [`docs/api-consumption.md`](./docs/api-consumption.md).
4. Para probar login Google, recordar los orígenes JS autorizados en Google
   Cloud Console (ver `docs/deployment.md`).
5. `bun run build` sin errores; si no tienes `get_errors`, usa `npx vue-tsc -b --noEmit` y
   compara con los errores previos.
6. Verificación en el navegador contra un backend **local** (3030) cuando el cambio es de UI;
   con secretos, comprobar que no quedan en cookies, `localStorage` ni `sessionStorage`.
7. Tareas marcadas en `tasks.md`; `git status` muestra solo tus archivos y
   `git add <rutas explícitas>`.
