# Documentación — Frontend (deportes-fi)

Aplicación web del **Sistema de Deportes de la Facultad de Ingeniería (UNDC)**,
construida con Nuxt 4 + Vue 3 + Tailwind CSS 4. Consume la API del backend
(`/api/v1`).

## Índice

- [overview.md](./overview.md) — Qué hace, qué se quiere lograr y lo planteado.
- [architecture.md](./architecture.md) — Estructura Nuxt, composables, stores.
- [api-consumption.md](./api-consumption.md) — Cómo se consume el backend.
- [deployment.md](./deployment.md) — Despliegue (Docker / Dokploy), variables.
- [Integración con el congreso](#integración-con-el-congreso-semana-sistémica) — Tokens por evento que el congreso (`backend-ciisic`) usa para la "Semana Sistémica" (Contrato 2).
- [`../AGENTS.md`](../AGENTS.md) — Forma de trabajar: comandos, reglas, ecosistema y checklist.

## Flujo actual

- `login.vue` usa Google Identity sin lista de dominios permitidos.
- `completar-perfil.vue` muestra facultad/escuela para `STUDENT` y solo DNI para
  `OTHER`.
- `estado-inscripcion.vue` funciona como **Mis inscripciones**, con equipos donde
  el usuario es delegado o integrante.
- `admin/inscripciones.vue` unifica la revisión de equipos gratuitos y pagados,
  mostrando teléfono de contacto del equipo/delegado e incluyendo voucher
  incrustado en el modal.
- `admin/usuarios.vue` permite administrar roles no administrativos `STUDENT` y
  `OTHER`.

## Integración con el congreso (Semana Sistémica)

El backend del congreso (CIISIC) muestra en su panel la recaudación de la "Semana Sistémica"
sumando sus inscripciones y los pagos validados de un evento de deportes-fi (Contrato 2 de
`backend-ciisic/docs/arquitectura-ecosistema.md`). Para autorizarlo se usa un **token por
evento** que se genera en este frontend:

1. **Admin → Eventos → «Tokens API»** en el evento deportivo (`admin/eventos.vue`, solo
   OWNER/ADMIN). Nombre descriptivo (p. ej. "Congreso CIISIC 2026") y expiración opcional (vence
   al final de ese día).
2. Al crearlo se muestra el token completo `dfi_…` **una sola vez**: "Copiar" y "Ya lo guardé".
   Después solo se ve su prefijo; si se pierde, se crea otro y se revoca el anterior.
3. Un administrador del congreso lo registra en su panel: **Eventos → (evento) → Integraciones**,
   con la URL base del backend de deportes-fi (`https://<host>/api/v1`) y el token; ahí mismo
   puede probar la conexión.
4. **Revocar** (con confirmación, irreversible) corta la integración de inmediato: el congreso
   recibe 401 y lo muestra como error de la integración.

El frontend solo gestiona los tokens (`GET/POST /events/:eventId/api-tokens`,
`DELETE /events/:eventId/api-tokens/:id`, ver [api-consumption.md](./api-consumption.md)); quien
llama a `/integrations/event/*` es el backend del congreso, servidor a servidor. El token nunca
se guarda en cookies, `localStorage`, stores ni consola. Contrato completo: backend
`docs/api-contract.md` (secciones "Tokens de integración del evento" e "Integración por evento
(Contrato 2)"); spec: [`../specs/001-gestion-tokens-evento/`](../specs/001-gestion-tokens-evento/).

## Stack

| Capa          | Tecnología                          |
| ------------- | ----------------------------------- |
| Framework     | Nuxt 4 (Vue 3, SSR/Nitro)           |
| Lenguaje      | TypeScript (`<script setup>`)       |
| Runtime / PM  | Bun                                 |
| Estilos       | Tailwind CSS 4 (`@tailwindcss/vite`), tema oscuro/neón, fuente Rajdhani |
| Estado        | Pinia (`@pinia/nuxt`)               |
| Gráficos      | Chart.js + vue-chartjs              |
| Iconos        | lucide-vue-next                     |
| Auth          | Google Identity (`@types/google.accounts`) |

## Arranque local

```powershell
bun install
bun run dev        # http://localhost:3000
```

Requiere el backend corriendo en `http://localhost:3001/api/v1` (configurable por
`NUXT_PUBLIC_API_BASE`).

Con el ecosistema del congreso levantado, el backend corre en `http://localhost:3030/api/v1` y
los puertos 3000/3001 están ocupados: ver "Entorno y comandos" en [`../AGENTS.md`](../AGENTS.md).
