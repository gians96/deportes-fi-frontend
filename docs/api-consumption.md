# Consumo de la API — Frontend

Todo el acceso al backend pasa por el composable **`useApi()`**
([`app/composables/useApi.ts`](../app/composables/useApi.ts)). No se usa `fetch`
directo en las páginas.

## Configuración

`useApi()` toma la base de `runtimeConfig.public.apiBase`:

```ts
// nuxt.config.ts
runtimeConfig: {
  public: {
    apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001/api/v1',
    googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  },
}
```

## Métodos disponibles

| Método | Firma | Uso |
| ------ | ----- | --- |
| `get`    | `get<T>(path, query?)` | Lecturas; `query` se serializa como querystring |
| `post`   | `post<T>(path, body?)` | Crear (JSON) |
| `patch`  | `patch<T>(path, body?)`| Actualizar (JSON) |
| `put`    | `put<T>(path, body?)`  | Reemplazar (JSON), p. ej. tarifas del evento |
| `del`    | `del<T>(path)`         | Eliminar |
| `upload` | `upload<T>(path, formData, method = 'POST')` | `multipart/form-data` (vouchers); `'PATCH'` para reemplazar un comprobante rechazado |

Comportamiento automático:
- Adjunta `Authorization: Bearer <token>` si hay sesión (`auth.token`).
- En respuesta **401** llama a `auth.clearSession()` (cierra sesión).
- `Content-Type: application/json` solo cuando hay `body` (no en `FormData`).

## Ejemplos

```ts
const api = useApi()

// Listar con filtros
const disciplines = await api.get<Discipline[]>('/disciplines', {
  eventId: 3, facultyId: 1,
})

// Crear (JSON)
await api.post('/users', { email, fullName, role: 'OTHER', dni })

// Actualizar
await api.patch(`/events/${id}`, { isOpen: false })

// Eliminar
await api.del(`/disciplines/${id}`)

// Subir equipo con voucher (multipart)
const fd = new FormData()
fd.append('disciplineId', String(disciplineId))
fd.append('teamName', teamName)
fd.append('participants', JSON.stringify(participants)) // arreglo serializado
fd.append('voucher', file)
await api.upload('/registrations', fd)
```

## Endpoints consumidos por página (resumen)

| Página | Endpoints principales |
| ------ | --------------------- |
| `login.vue` | `POST /auth/google`; acepta cualquier correo verificado por Google y el rol lo resuelve el backend |
| `completar-perfil.vue` | `GET /faculties` para `STUDENT`; `PATCH /auth/me/profile` con `{ facultyId, schoolId }` para `STUDENT` o `{ dni }` para `OTHER` |
| `index.vue` / `eventos/` | `GET /events`, `GET /events/:id`; en eventos `PER_GROUP` el detalle muestra las tarifas (`GET /events/:id/pricing`, con sesión) y enlaza a `inscripcion/grupo/:eventId` |
| `disciplinas/` | `GET /disciplines`, `GET /disciplines/:id`; `GET /events/:id` para saber si el evento cobra por salón o ciclo (el botón lleva al hub) |
| `inscripcion/[id].vue` | `GET /disciplines/:id`, `GET /academic/student` o `GET /academic/dni` (según `participantType`), `POST /registrations`. En eventos `PER_GROUP` exige `?groupId=` (si falta redirige al hub) y además usa `GET /events/:id`, `GET /groups/:id` y `GET /events/:id/pricing`; envía `groupId`, `extraVoucherId`, `isCaptain` y DNI por integrante, y solo adjunta voucher en equipos adicionales |
| `inscripcion/grupo/[eventId].vue` | Hub "Mi salón o ciclo": `GET /events/:id`, `GET /events/:id/pricing`, `GET /faculties`, `GET /groups/mine?eventId=`, `POST /groups` (multipart), `PATCH /vouchers/:id/replace` (multipart) vía `GroupVoucherPanel` |
| `estado-inscripcion.vue` | `GET /registrations/mine`; los equipos de un salón o ciclo (`groupId`, `slot`) se muestran como "Pago del salón o ciclo" / "Equipo adicional" y enlazan al hub |
| `admin/facultades.vue` | `GET/POST/PATCH/DELETE /faculties` y `/schools` |
| `admin/eventos.vue` | `GET/POST/PATCH/DELETE /events`; modal "Tokens API" por evento: `GET/POST /events/:eventId/api-tokens` y `DELETE /events/:eventId/api-tokens/:id` (revocar). El `token` en claro de la respuesta de creación se muestra una sola vez y no se persiste; modal "Cobro" por evento: `GET/PUT /events/:id/pricing` (modo `PER_DISCIPLINE`/`PER_GROUP` y cuatro tarifas) |
| `admin/grupos.vue` | `GET /events`, `GET /groups?eventId=`, `PATCH /vouchers/:id/validate` (devuelve `approvedTeamIds` y `skipped`), `PATCH /vouchers/:id/reject`, `PATCH /registrations/:id/approve` |
| `admin/disciplinas/index.vue` | `GET/POST/PATCH/DELETE /disciplines` (con filtros), cierre con `datetime-local`, puntaje configurable, muestra `teamsCount`; para `REFEREE` queda solo lectura con acceso a fixture |
| `admin/disciplinas/[id]/fixture.vue` | `GET /disciplines/:id/fixture`, `POST /disciplines/:id/fixture/generate` (solo admin), `PATCH /matches/:id`, `PATCH /matches/:id/result` con autosave, `POST /disciplines/:id/standings/recalculate` (solo admin) |
| `admin/inscripciones.vue` | `GET /registrations` con filtros (`status`, `eventId`, `disciplineId`, `isPaid`, `participantType`) y `phone` del equipo/delegado, `POST /registrations`, `PATCH /registrations/:id/approve\|reject`, `PATCH /vouchers/:id/validate`, `GET /disciplines`, `GET /academic/student` o `GET /academic/dni` (según `participantType`) |
| `resultados/[id].vue` | `GET /standings/:disciplineId`; muestra tabla principal para puntos y llave responsive para eliminación |
| `admin/vouchers.vue` | `GET /vouchers`, `PATCH /vouchers/:id/validate\|reject` (vista secundaria de compatibilidad) |
| `admin/usuarios.vue` | `GET/POST /users`, `PATCH /users/:id`, `/users/:id/active`, `/users/:id/role`; incluye rol `REFEREE` |
| `admin/dashboard.vue` | `GET /admin/dashboard` |

> El contrato completo (bodies y reglas) está en el repo del backend:
> `backend/docs/api-contract.md`.
