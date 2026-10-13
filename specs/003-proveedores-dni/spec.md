# Feature Specification: Pantalla de proveedores de DNI (frontend)

**Feature Branch**: `feat/proveedores-dni`

**Created**: 2026-10-13

**Status**: Implementada (2026-10-13)

**Input**: "Que no esté dentro del environment, sino guardado por BD, que se muestre por la web y que
sea editable y dinámico sin tener que recargar el environment."

**Depende de**: `backend/specs/003-proveedores-dni` (implementada). Esta spec solo cubre la pantalla;
las reglas, el cifrado y la cadena de respaldo viven en el backend.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver y editar los proveedores de DNI (Priority: P1)

Un administrador (OWNER o ADMIN) entra a **Admin → Integraciones** y ve una tarjeta por proveedor
(Decolecta, API Perú) con su puesto en la cadena, el estado (`Sin token`, `Sin verificar`,
`Funcionando`, `Token rechazado`), la máscara del token guardado, la fecha de la última consulta y el
último error. Puede cambiar token, URL, prioridad y activación sin tocar el servidor.

**Independent Test**: guardar un token, ver solo `••••abcd` en la tarjeta, recargar la página y
comprobar que el token no vuelve a mostrarse completo.

**Acceptance Scenarios**:

1. **Given** un proveedor sin token, **When** el administrador escribe uno y pulsa "Guardar cambios",
   **Then** la tarjeta muestra la máscara, "Guardado. El nuevo token ya se usa en las consultas." y
   el campo del token queda vacío.
2. **Given** un token guardado, **When** se guardan cambios sin escribir token, **Then** el token no
   se envía y se conserva.
3. **Given** una URL personalizada, **When** el administrador la deja vacía y guarda, **Then** se
   restablece la URL oficial del proveedor.
4. **Given** un token guardado, **When** pulsa "Quitar token" y confirma, **Then** el proveedor queda
   "Sin token" y se limpia cualquier resultado de prueba anterior.
5. **Given** un usuario que no es OWNER/ADMIN, **When** abre la ruta, **Then** el middleware `admin`
   lo redirige.
6. **Given** que el servidor deriva la clave de cifrado de `JWT_SECRET`, **When** se abre la página,
   **Then** se muestra un aviso con cómo fijar una clave propia (`INTEGRATION_SECRET_KEY`).

### User Story 2 - Probar un proveedor (Priority: P2)

Con un DNI de 8 dígitos, "Probar" hace una consulta real y muestra solo si el proveedor respondió
(nunca datos de la persona) y actualiza el estado de la tarjeta.

**Acceptance Scenarios**:

1. **Given** un token válido, **When** se prueba un DNI de 8 dígitos, **Then** aparece "El proveedor
   respondió correctamente." y la tarjeta pasa a `Funcionando`.
2. **Given** un DNI que no tiene 8 dígitos, **When** se pulsa "Probar", **Then** se avisa sin llamar a
   la API.
3. **Given** un proveedor sin token, **Then** el botón "Probar" está deshabilitado.

## Requirements *(mandatory)*

- **FR-001**: Página `admin/integraciones.vue` (layout `admin`, middleware `admin`) y entrada
  "Integraciones" en el menú del panel.
- **FR-002**: Consume `GET /settings/dni-providers`, `PUT /settings/dni-providers/:provider` y
  `POST /settings/dni-providers/:provider/test` (ver `docs/api-consumption.md`).
- **FR-003**: El token se escribe en un `input type="password"`, se envía **una sola vez** y se borra
  del estado local al guardar. Nunca se guarda en cookies, `localStorage`, `sessionStorage`, stores
  ni consola; la pantalla solo muestra `tokenMask`.
- **FR-004**: `PUT` envía siempre `enabled` y `priority`; `token` solo si se escribió; `apiUrl` solo si
  cambió (cadena vacía = URL oficial); quitar el token envía `{ token: null }` tras confirmar con
  `AppConfirm`.
- **FR-005**: Los errores del backend se muestran desde `err.data.message` (`apiMessage`); los textos
  de la UI van en español.
- **FR-006**: Tipos en `app/types/domain.ts` (`DniProviderConfig`, `DniProvidersResponse`,
  `DniProviderTestResult`, …) reflejan `backend/docs/api-contract.md`.

## Success Criteria

- **SC-001**: Un administrador carga el token de API Perú desde la web y la siguiente consulta de DNI
  lo usa, sin reiniciar nada.
- **SC-002**: Tras guardar, el token no aparece en la red de vuelta, en el DOM, en el almacenamiento
  del navegador ni en la consola.

## Evidencia de verificación (2026-10-13)

- Type-check (`vue-tsc` 3.3.13 con TypeScript 5.9.3): sin errores en `integraciones.vue`,
  `domain.ts` ni `layouts/admin.vue` (los errores previos de otros archivos no cambian).
- `bun run build` correcto.
- Navegador contra el backend local (3030, base `deportes_fi_local`) y proveedores simulados:
  la página lista ambos proveedores y el aviso de clave derivada; guardar un token de API Perú con
  URL local muestra `····ABCD` y "Guardado. El nuevo token ya se usa en las consultas."; "Probar" con
  un DNI de 8 dígitos llega al proveedor con `Authorization: Bearer <token guardado>` y responde "El
  proveedor respondió correctamente." con el chip en "Funcionando"; "Quitar token" abre la
  confirmación, borra el token ("Token eliminado.", "Sin token", "Nunca") y la base queda sin texto
  cifrado. Se corrigió que el resultado de prueba anterior siguiera visible tras quitar el token.
- Sin rastro del token en cookies (solo `deportes_fi_token`), `localStorage` ni `sessionStorage`.
- Pendiente: vista móvil y el caso de error del proveedor (token rechazado → chip "Token rechazado").
