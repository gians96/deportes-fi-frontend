# Feature Specification: Pantalla de consultas de DNI (pool de tokens), frontend

**Feature Branch**: `feat/pool-tokens-dni`

**Created**: 2026-10-14

**Status**: Implementada (2026-10-14); reemplaza la pantalla de la spec 003

**Input**: "En Integraciones solo se admiten Decolecta y API Perú como filas fijas: que sea una gestión de cada
uno, poder agregar más tokens del mismo proveedor y que se administren por prioridad; si uno falla sigue con el
siguiente. Hazlo igual que admin-ciisic.episundc.pe/consultas y que cachee las consultas."

**Depende de**: `backend/specs/005-pool-tokens-dni` (implementada). Esta spec solo cubre la pantalla.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Administrar el pool de tokens (Priority: P1)

En **Admin → Integraciones** (solo Owner y Administrador) hay una tabla de tokens ordenada por prioridad: alias,
proveedor y máscara, uso con barra de progreso, renovación, estado (Activo, Agotado, Inválido; «Pausado» aparte) y las
acciones **Probar**, **Reiniciar**, **Pausar/Activar**, **Editar** y **Eliminar**. «Agregar token» abre el formulario
(proveedor, alias, token, límite, usadas, renovación, prioridad, URL opcional, activo).

**Acceptance Scenarios**:

1. **Given** el formulario de alta, **When** se guarda, **Then** el token aparece con su máscara y el campo del token
   queda vacío; el valor no se vuelve a mostrar ni se guarda en el navegador.
2. **Given** dos tokens del mismo proveedor, **Then** se listan por prioridad y se puede cambiar el orden editando la
   prioridad.
3. **Given** un token agotado o inválido, **When** se pulsa «Reiniciar» y se confirma, **Then** vuelve a «Activo» con el
   contador en 0.
4. **Given** «Pausar», **Then** el token deja de contar como disponible (sigue en la lista, atenuado).
5. **Given** «Eliminar», **When** se confirma, **Then** desaparece y su historial queda en la bitácora sin el token.
6. **Given** que no hay ningún token disponible, **Then** se muestra un aviso de que la validación de DNI no estará
   disponible.

### User Story 2 - Probar y consultar (Priority: P2)

«Probar» pide un DNI de 8 dígitos, hace una consulta real con ese token y muestra solo si respondió (sin datos
personales). La **consulta manual** usa el pool y la caché y muestra el nombre y de dónde salió (caché o proveedor).
«Vaciar la caché» pide confirmación.

### User Story 3 - Ver el uso (Priority: P2)

Tres tarjetas (tokens disponibles, consultas restantes, consultas de 30 días), un gráfico de barras apiladas por día
y resultado, y una **bitácora** paginada con el DNI enmascarado, el origen (Perfil, Equipo, Panel), el token, el
resultado, el código HTTP y los milisegundos.

## Requirements *(mandatory)*

- **FR-001**: `admin/integraciones.vue` consume `GET/POST /settings/dni-tokens`, `PATCH/DELETE :id`, `POST :id/reset`,
  `POST :id/test`, `GET usage`, `GET logs`, `POST lookup` y `DELETE cache` (ver `docs/api-consumption.md`).
- **FR-002**: El token se escribe en un `input type="password"`, se envía una vez y se borra del formulario; nunca se
  guarda en cookies, `localStorage`, `sessionStorage`, stores ni consola. La pantalla solo muestra `tokenMask`.
- **FR-003**: Al editar, el token solo se envía si se escribió uno nuevo; la URL vacía restablece la oficial.
- **FR-004**: Las acciones destructivas o que cambian el estado (reiniciar, eliminar, vaciar caché) usan `AppConfirm`.
- **FR-005**: Aviso de la clave de cifrado (`derived` en amarillo, `none` en rojo) y errores del backend en español.
- **FR-006**: Gráfico con `vue-chartjs` (`DniUsageChart.client.vue`), sin librerías nuevas.
- **FR-007**: El Tesorero no ve la pantalla (`middleware/admin.ts` ⇒ 403).

## Success Criteria

- **SC-001**: Un administrador agrega un segundo token del mismo proveedor y, al agotarse el primero, las consultas
  siguen sin intervención.
- **SC-002**: Tras guardar, el token no aparece en la red de vuelta, el DOM, el almacenamiento ni la consola.

## Evidencia de verificación (2026-10-14)

- Type-check (`vue-tsc` 3.3.13 con TypeScript 5.9.3): sin errores en `integraciones.vue`, `DniUsageChart.client.vue` ni
  `domain.ts`; `bun run build` correcto.
- Navegador contra el backend local (3030, base `deportes_fi_local`) como Owner, con proveedores simulados: estado vacío
  con aviso rojo/amarillo; alta de un token desde el formulario; con tres tokens (uno rechazado, uno con límite 3, uno
  de API Perú) y consultas hechas como estudiante la tabla muestra «Inválido» con su error, «Agotado 3/3» (barra roja) y
  «Activo 3/∞», las tarjetas cuentan `1 / 3` disponibles y 8 consultas, y la bitácora trae DNI enmascarados
  (`71****01`) con origen y resultado. «Probar» el token rechazado muestra «El proveedor rechazó el token…»;
  «Reiniciar» (con confirmación) deja `0 / 3` activo; «Pausar» baja los disponibles; «Editar» renombra y reordena por
  prioridad (5, 10, 30); «Eliminar» lo quita; la consulta manual responde «desde la caché» y «vía DECOLECTA», y
  «Ningún proveedor encontró ese DNI»; «Vaciar la caché» borra 6 entradas y la consulta siguiente vuelve al proveedor. El
  gráfico apilado se dibuja.
- Cookies: solo `g_state` y `deportes_fi_token`; `localStorage` y `sessionStorage` vacíos.
- Pendiente: vista móvil y probar con Decolecta/API Perú reales (hace falta un token propio).
