# Quickstart: verificación local

> Usa siempre un backend **local** (nunca el de producción) para probar la gestión de tokens.

1. Backend local en `http://localhost:3030/api/v1` contra MariaDB de Docker (ver
   `backend/specs/001-tokens-api-por-evento/quickstart.md`), con
   `CORS_ORIGIN=http://localhost:3000`.
2. Frontend apuntando a ese backend:

   ```powershell
   $env:NUXT_PUBLIC_API_BASE = 'http://localhost:3030/api/v1'
   bun run dev    # http://localhost:3000
   ```

3. Sesión de administrador: iniciar sesión con Google con una cuenta de `OWNER_EMAILS` /
   `ADMIN_EMAILS` del backend local (o, solo en local, cargar en la cookie
   `deportes_fi_token` un JWT de prueba firmado con el `JWT_SECRET` local).
4. Ir a **Admin → Eventos** → "Tokens API" en un evento y comprobar:
   - Crear con nombre y sin fecha → aparece el aviso con el token completo, "Copiar" funciona y
     la lista muestra el token como **Activo** con su prefijo.
   - "Ya lo guardé" o cerrar el modal → el token completo ya no se ve; reabrir muestra solo el
     prefijo.
   - Crear con fecha de expiración → la columna "Vence" muestra el fin de ese día.
   - "Revocar" → confirmación → estado **Revocado** y sin acción de revocar.
   - Con el token revocado, `GET /integrations/event` con `X-Api-Key` responde 401.
5. Verificar que `localStorage`, `sessionStorage` y las cookies no contienen `dfi_`.
