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
| `login.vue` | `POST /auth/google` (cualquier correo verificado por Google; el rol lo resuelve el backend) y `POST /auth/login` (correo y contraseña, solo para cuentas con «Contraseña o Google»; el error siempre es «Credenciales incorrectas» y 5 fallos bloquean 15 min con 429). La contraseña no se guarda en ningún lado |
| `completar-perfil.vue` | `GET /faculties` para `STUDENT`; `PATCH /auth/me/profile` con `{ facultyId, schoolId }` para `STUDENT` o `{ dni }` para `OTHER` |
| `index.vue` / `eventos/` | `GET /events`, `GET /events/:id`; en eventos `PER_GROUP` el detalle muestra las tarifas (`GET /events/:id/pricing`, con sesión) y enlaza a `inscripcion/grupo/:eventId` |
| `disciplinas/` | `GET /disciplines`, `GET /disciplines/:id`; `GET /events/:id` para saber si el evento cobra por salón o ciclo (el botón lleva al hub) |
| `inscripcion/[id].vue` | `GET /disciplines/:id`, `GET /academic/student` o `GET /academic/dni` (según `participantType`), `POST /registrations`. En eventos `PER_GROUP` exige `?groupId=` (si falta redirige al hub) y además usa `GET /events/:id`, `GET /groups/:id` y `GET /events/:id/pricing`; envía `groupId`, `extraVoucherId`, `isCaptain` y DNI por integrante, y solo adjunta voucher en equipos adicionales |
| `inscripcion/grupo/[eventId].vue` | Hub "Mi salón o ciclo": `GET /events/:id`, `GET /events/:id/pricing`, `GET /faculties`, `GET /groups/mine?eventId=`, `POST /groups` (multipart), `PATCH /vouchers/:id/replace` (multipart) vía `GroupVoucherPanel` |
| `estado-inscripcion.vue` | `GET /registrations/mine`; los equipos de un salón o ciclo (`groupId`, `slot`) se muestran como "Pago del salón o ciclo" / "Equipo adicional" y enlazan al hub |
| `admin/facultades.vue` | `GET/POST/PATCH/DELETE /faculties` y `/schools` |
| `admin/eventos.vue` | `GET/POST/PATCH/DELETE /events`; modal "Tokens API" por evento: `GET/POST /events/:eventId/api-tokens` y `DELETE /events/:eventId/api-tokens/:id` (revocar). El `token` en claro de la respuesta de creación se muestra una sola vez y no se persiste; modal "Cobro" por evento: `GET/PUT /events/:id/pricing` (modo `PER_DISCIPLINE`/`PER_GROUP` y cuatro tarifas) |
| `admin/grupos.vue` | `GET /events`, `GET /groups?eventId=`, `PATCH /vouchers/:id/validate` (devuelve `approvedTeamIds` y `skipped`), `PATCH /vouchers/:id/reject`, `PATCH /registrations/:id/approve` |
| `admin/integraciones.vue` | `GET/POST /settings/dni-tokens`, `PATCH/DELETE /settings/dni-tokens/:id`, `POST :id/reset`, `POST :id/test`, `GET usage` y `GET logs` (pool de tokens de DNI con prioridad, cupo, renovación, caché de 30 días y bitácora con DNI enmascarado), `POST lookup` (consulta manual) y `DELETE cache`. El token se envía una vez, nunca se vuelve a recibir (solo una máscara) y los cambios rigen sin reiniciar el servidor |
| `admin/disciplinas/index.vue` | `GET/POST/PATCH/DELETE /disciplines` (con filtros), cierre con `datetime-local`, puntaje configurable, muestra `teamsCount`; para `REFEREE` queda solo lectura con acceso a fixture |
| `admin/disciplinas/[id]/fixture.vue` | `GET /disciplines/:id/fixture`, `POST /disciplines/:id/fixture/generate` (solo admin), `PATCH /matches/:id`, `PATCH /matches/:id/result` con autosave, `POST /disciplines/:id/standings/recalculate` (solo admin) |
| `admin/inscripciones.vue` | `GET /registrations` con filtros (`status`, `eventId`, `disciplineId`, `isPaid`, `participantType`) y `phone` del equipo/delegado, `POST /registrations`, `PATCH /registrations/:id/approve\|reject`, `PATCH /vouchers/:id/validate`, `GET /disciplines`, `GET /academic/student` o `GET /academic/dni` (según `participantType`) |
| `resultados/[id].vue` | `GET /standings/:disciplineId`; muestra tabla principal para puntos y llave responsive para eliminación |
| `admin/vouchers.vue` | `GET /vouchers`, `PATCH /vouchers/:id/validate\|reject` (vista secundaria de compatibilidad) |
| `admin/usuarios.vue` | `GET/POST /users`, `PATCH /users/:id`, `/users/:id/active`, `/users/:id/role`, `/users/:id/password`; roles `STUDENT`, `OTHER`, `REFEREE`, `TREASURER` (y `ADMIN_SYSTEM`/`OWNER_SYSTEM` solo si quien opera es Owner); «Acceso» = Solo Google o Contraseña o Google; el listado trae `hasPassword` y `googleLinked`, nunca el hash |
| `admin/dashboard.vue` | `GET /admin/dashboard` |

### Borradores, edición, comprobante y API UNDC (spec 006)

| Pantalla o componente | Llamadas |
| --------------------- | -------- |
| `inscripcion/[id].vue` (equipos de un salón o ciclo) | «Guardar borrador» nuevo: `POST /registrations` (multipart) con `draft=true`; borrador existente (`?teamId=`): carga con `GET /registrations/mine` y guarda con `PATCH /registrations/:id` (JSON `{ teamName, phone, participants[] }`, la nómina se reemplaza completa); «Enviar inscripción»: `POST /registrations` sin `draft` (equipo nuevo) o `PATCH` + `POST /registrations/:id/submit` (borrador). Busca personas con `GET /academic/student?buscador=` (devuelve `dni` cuando API UNDC está conectada) o `GET /academic/dni` |
| `inscripcion/grupo/[eventId].vue` | Muestra `draftCount`, `rejectionReason` y el estado `DRAFT` de `GET /groups/mine`; «Enviar» → `POST /registrations/:id/submit`; «Quitar» → `DELETE /registrations/:id` (solo borradores). `POST /groups` responde 409 si el estudiante ya tiene un salón o ciclo activo en el evento (la pantalla oculta el formulario con la misma regla, `isActiveGroup`) |
| `components/AdminTeamEditModal.vue` (en `admin/inscripciones.vue`) | `PATCH /registrations/:id` (Owner y Administrador, cualquier estado salvo cancelado) con búsqueda por `GET /academic/student` o `/dni`; los errores del servidor se muestran tal cual. Filtro «Borradores» = `DRAFT` (el Tesorero no los recibe) |
| `admin/grupos.vue` | «Validar pago» se desactiva si el comprobante no cubre ningún equipo enviado (`status !== 'DRAFT'`); cuenta los borradores aparte |
| `components/VoucherViewerModal.vue` / `VoucherLink.vue` | Sin llamadas: muestran `/uploads/vouchers/…` (servido por el backend) dentro de un modal |
| `components/UndcApiCard.vue` (en `admin/integraciones.vue`) | `GET`, `PUT` y `DELETE /settings/undc-api`, `POST /settings/undc-api/test`. La API key viaja una sola vez en el `PUT`; la respuesta solo trae `keyMask` |

> El contrato completo (bodies y reglas) está en el repo del backend:
> `backend/docs/api-contract.md`.
