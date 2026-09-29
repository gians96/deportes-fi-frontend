# Contrato consumido — Tokens de integración por evento

Fuente: backend `docs/api-contract.md` (sección "Tokens de integración del evento") y
`specs/001-tokens-api-por-evento/contracts/admin-api-tokens.md`. Todas las llamadas llevan
`Authorization: Bearer <jwt>` (lo agrega `useApi()`); requieren rol `OWNER_SYSTEM` o
`ADMIN_SYSTEM`.

| Uso en la UI | Llamada | Respuesta |
| --- | --- | --- |
| Abrir el modal / refrescar | `api.get<EventApiToken[]>(\`/events/${eventId}/api-tokens\`)` | lista ordenada por `createdAt` desc |
| Crear | `api.post<CreatedEventApiToken>(\`/events/${eventId}/api-tokens\`, { name, expiresAt? })` | `201` con `token` (única vez) |
| Revocar | `api.del<EventApiToken>(\`/events/${eventId}/api-tokens/${id}\`)` | token con `status: 'REVOKED'` |

## Tipos (`app/types/domain.ts`)

```ts
export type EventApiTokenStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED'

export interface EventApiToken {
  id: number
  eventId: number
  name: string
  tokenPrefix: string
  createdById?: number | null
  lastUsedAt: string | null
  expiresAt: string | null
  revokedAt: string | null
  createdAt: string
  status: EventApiTokenStatus
}

export interface CreatedEventApiToken {
  id: number
  name: string
  tokenPrefix: string
  expiresAt: string | null
  createdAt: string
  token: string
}
```

## Errores esperados

| Código | Mensaje (backend) | Tratamiento en la UI |
| --- | --- | --- |
| 400 | validación (`name`, `expiresAt`) o "La fecha de expiración debe ser futura" | se muestra bajo el formulario |
| 401 | sesión inválida | `useApi()` cierra la sesión |
| 403 | "No tienes permisos para esta acción" | se muestra en el modal |
| 404 | "Evento no encontrado" / "Token no encontrado" | se muestra en el modal |
| 503 | "Los tokens de integración no están configurados en el servidor" | se muestra en el modal |
