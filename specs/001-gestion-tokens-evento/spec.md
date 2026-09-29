# Feature Specification: Gestión de tokens API por evento

**Feature Branch**: `feat/tokens-evento`

**Created**: 2026-09-29

**Status**: Aprobada (lista para implementar)

**Input**: "En el panel de eventos, una acción 'Tokens API' por evento para crear (con
expiración opcional), listar y revocar los tokens de integración que usa el sistema del congreso;
el token se muestra una sola vez con botón de copiar."

**Depende de**: backend `specs/001-tokens-api-por-evento` (endpoints
`/events/:eventId/api-tokens`).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear un token y copiarlo una sola vez (Priority: P1)

Un administrador abre la gestión de tokens de un evento, escribe un nombre (p. ej. "Congreso
CIISIC 2026"), opcionalmente elige una fecha de expiración y crea el token. La pantalla le muestra
el token completo una sola vez, con un botón para copiarlo y la advertencia "Cópialo ahora, no se
volverá a mostrar".

**Why this priority**: sin este flujo el congreso no puede integrarse.

**Independent Test**: crear un token desde el modal, copiarlo, cerrar el modal y volver a abrirlo:
el token ya no se ve, solo su prefijo.

**Acceptance Scenarios**:

1. **Given** el administrador en "Eventos", **When** pulsa "Tokens API" en un evento, **Then** se
   abre un modal con el nombre del evento, el formulario de creación y la lista de tokens.
2. **Given** el formulario con nombre válido, **When** crea el token, **Then** ve el token
   completo, un botón "Copiar" y la advertencia; el token nuevo aparece en la lista como
   "Activo".
3. **Given** el token visible, **When** pulsa "Copiar", **Then** el token queda en el
   portapapeles y el botón confirma "Copiado".
4. **Given** el token visible, **When** pulsa "Ya lo guardé" o cierra el modal, **Then** el token
   desaparece de la pantalla y no puede recuperarse.
5. **Given** un error del servidor (p. ej. fecha pasada o servidor sin configurar), **When** crea
   el token, **Then** ve el mensaje del servidor en español dentro del modal.

---

### User Story 2 - Ver los tokens de un evento y su estado (Priority: P1)

El administrador revisa qué tokens existen para el evento: nombre, prefijo, fecha de creación,
último uso, expiración y estado (activo, revocado o expirado).

**Why this priority**: permite saber qué credencial usa el congreso y si sigue vigente.

**Independent Test**: con tokens activos, revocados y expirados creados desde la API, abrir el
modal y comprobar columnas y estados.

**Acceptance Scenarios**:

1. **Given** un evento con tokens, **When** se abre el modal, **Then** cada token muestra nombre,
   prefijo (`dfi_xxxxxxxx…`), creado, último uso ("Nunca" si no se usó), vence ("Sin
   expiración" si no tiene) y un estado con color: Activo, Revocado o Expirado.
2. **Given** un evento sin tokens, **When** se abre el modal, **Then** se ve un mensaje vacío que
   invita a crear el primero.

---

### User Story 3 - Revocar un token con confirmación (Priority: P2)

El administrador revoca un token que ya no debe usarse; el sistema pide confirmación y, tras
revocarlo, lo muestra como "Revocado".

**Why this priority**: respuesta ante filtraciones o fin de la integración.

**Independent Test**: revocar un token activo y comprobar el estado y que la integración con ese
token responde 401.

**Acceptance Scenarios**:

1. **Given** un token activo, **When** pulsa "Revocar", **Then** aparece una confirmación que
   advierte que las integraciones que lo usan dejarán de funcionar.
2. **Given** la confirmación, **When** confirma, **Then** el token pasa a "Revocado" y ya no
   ofrece la acción de revocar.
3. **Given** la confirmación, **When** cancela, **Then** no cambia nada.

### Edge Cases

- El navegador no permite usar el portapapeles (contexto no seguro o permiso denegado): se
  selecciona el texto del token y se indica copiarlo manualmente.
- Se abre el modal de otro evento: el formulario, la lista y cualquier token visible se
  reinician.
- La fecha de expiración elegida es hoy: el token vence al final de ese día (hora local); no se
  permiten fechas pasadas.
- Falla la carga de la lista: se muestra el error y un botón para reintentar.
- Se pulsa "Crear" dos veces seguidas: el botón se deshabilita mientras se procesa.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La página de eventos del panel MUST ofrecer, por evento, la acción "Tokens API".
- **FR-002**: El modal MUST listar los tokens del evento con nombre, prefijo, creado, último uso,
  vence y estado (Activo/Revocado/Expirado), usando el estado calculado por el servidor.
- **FR-003**: El formulario MUST pedir nombre (obligatorio, máximo 100 caracteres) y fecha de
  expiración opcional (no anterior a hoy), enviada como fin del día elegido en hora local.
- **FR-004**: Tras crear, el sistema MUST mostrar el token completo una sola vez con botón de
  copiar y la advertencia "Cópialo ahora, no se volverá a mostrar."; al descartarlo o cerrar el
  modal, el valor se elimina de la memoria de la página.
- **FR-005**: El token en claro MUST NOT guardarse en cookies, almacenamiento del navegador,
  stores ni registrarse en consola.
- **FR-006**: La revocación MUST pedir confirmación con `AppConfirm` y actualizar el estado en la
  lista.
- **FR-007**: Los errores del backend MUST mostrarse en español dentro del modal.
- **FR-008**: Todas las llamadas MUST hacerse con `useApi()` y tipos de `app/types/domain.ts`.

### Key Entities

- **Token de integración (vista)**: id, evento, nombre, prefijo, creado, último uso, vence,
  revocado, estado. Nunca incluye el valor completo.
- **Token recién creado**: lo anterior más el valor completo, disponible solo en la respuesta de
  creación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un administrador crea y copia un token en menos de 1 minuto.
- **SC-002**: Tras cerrar el aviso o el modal, el token completo no es recuperable desde la
  interfaz (0 apariciones en pantalla o en el almacenamiento del navegador).
- **SC-003**: El estado de un token revocado se refleja en la lista inmediatamente después de
  confirmar.
- **SC-004**: El 100 % de los errores del servidor en este flujo se muestran con su mensaje en
  español.

## Assumptions

- Solo OWNER/ADMIN acceden a la página (middleware `admin` existente); el backend vuelve a
  validar el rol.
- El usuario usa el panel en un navegador moderno; el portapapeles puede no estar disponible en
  HTTP no seguro.
- No se requiere editar ni reactivar tokens: para cambiar algo se crea uno nuevo y se revoca el
  anterior.
