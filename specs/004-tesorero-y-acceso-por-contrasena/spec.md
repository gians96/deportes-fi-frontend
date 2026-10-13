# Feature Specification: Tesorero y acceso por contraseña (frontend)

**Feature Branch**: `feat/tesorero-acceso`

**Created**: 2026-10-14

**Status**: Implementada (2026-10-14)

**Input**: "No tengo acceso como alumno, quiero hacer la prueba. Hay un tesorero; que tenga esos roles (Owner,
Administrador del sistema, Tesorero) y este inicio de sesión (Solo Google / Contraseña o Google)." Después:
"garias@undc.edu.pe es Owner del sistema; falta añadir el administrador del sistema."

**Depende de**: `backend/specs/004-tesorero-y-acceso-por-contrasena` (implementada). Esta spec solo cubre las
pantallas; las reglas, el hash y los permisos viven en el backend.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar con correo y contraseña (Priority: P1)

En `/login`, además de «Acceder con Google», hay un formulario de correo y contraseña. Sirve para cuentas
creadas por un Owner/Administrador con «Contraseña o Google» (por ejemplo un estudiante de prueba).

**Acceptance Scenarios**:

1. **Given** una cuenta con contraseña, **When** se ingresan correo y contraseña correctos, **Then** se entra y se
   redirige según el rol (`auth.homePath`: panel admin/tesorería, panel árbitro o inicio).
2. **Given** credenciales incorrectas, **When** se envían, **Then** se muestra «Credenciales incorrectas» (o el
   aviso de demasiados intentos) y el campo de contraseña queda vacío.
3. **Given** la contraseña escrita, **Then** nunca se guarda en cookies, `localStorage`, `sessionStorage`, el store
   ni la consola; «Mostrar/Ocultar» solo cambia el tipo del campo.

### User Story 2 - Crear cuentas con rol y acceso (Priority: P1)

En **Admin → Usuarios → Nuevo usuario** se elige rol (Estudiante, Otro, Árbitro, **Tesorero**; Administrador y
Owner solo si quien opera es Owner), **Acceso** («Solo Google» o «Contraseña o Google») y, con contraseña, se
escribe o genera (10 a 128 caracteres, con «Mostrar», «Generar» y «Copiar»). La tabla muestra una columna
**Acceso** y cada fila tiene la acción **Contraseña** (cambiar, o «Quitar contraseña» con confirmación).

**Acceptance Scenarios**:

1. **Given** el rol Tesorero, **Then** el formulario oculta facultad y escuela.
2. **Given** un estudiante con contraseña sin facultad/escuela, **Then** se avisa que tendrá que completar su perfil.
3. **Given** una contraseña de menos de 10 caracteres, **When** se envía, **Then** se avisa sin llamar a la API.
4. **Given** un Administrador (no Owner), **Then** no ve las opciones Administrador ni Owner.

### User Story 3 - Panel de Tesorería (Priority: P1)

El Tesorero entra a «FI Tesorería» con tres secciones: **Dashboard**, **Equipos de pago** y **Salones y ciclos**.
Valida o rechaza comprobantes; no aprueba ni rechaza equipos, no crea equipos y no ve usuarios, eventos ni
integraciones (`/403`).

## Requirements *(mandatory)*

- **FR-001**: `types/domain.ts`: `Role` suma `TREASURER`; `AuthUser` suma `hasPassword` y `googleLinked`.
- **FR-002**: `stores/auth.ts`: `isTreasurer`, `canValidatePayments`, `homePath` y `loginWithPassword`.
- **FR-003**: `middleware/admin.ts` deja entrar al Tesorero solo a `/admin/dashboard`, `/admin/inscripciones`,
  `/admin/grupos` y `/admin/vouchers`; `guest.ts`, `completar-perfil.vue` y `layouts/default.vue` usan `homePath`.
- **FR-004**: `layouts/admin.vue`: menú y rótulos de Tesorería; `dashboard.vue`: acciones rápidas solo de pagos.
- **FR-005**: `inscripciones.vue`: sin «Crear equipo», sin aprobar/rechazar inscripción para el Tesorero, que solo
  ve «Validar voucher» y «Rechazar comprobante» (`PATCH /vouchers/:id/reject`; el delegado puede reemplazarlo);
  no pide `/users`. `grupos.vue`: sin «Aprobar equipo» para el Tesorero.
- **FR-006**: `login.vue` con formulario; `usuarios.vue` con rol, acceso y contraseña como en US2.
- **FR-007**: La contraseña no se persiste en el navegador y se borra del formulario tras enviarla.

## Success Criteria

- **SC-001**: Un administrador crea un estudiante con contraseña y esa persona inscribe un salón sin Google.
- **SC-002**: Un Tesorero valida un comprobante y no puede entrar a ninguna pantalla de configuración.

## Evidencia de verificación (2026-10-14)

- Type-check (`vue-tsc` 3.3.13 con TypeScript 5.9.3): sin errores en los archivos tocados; `bun run build` correcto.
- Navegador contra el backend local (3030, base `deportes_fi_local`): el formulario de `/login` entra con un
  estudiante con contraseña y el hub del salón muestra su salón (S/100 pendiente) y los equipos por disciplina; solo
  quedan `g_state` y `deportes_fi_token` en las cookies y nada en `localStorage`/`sessionStorage`.
- Como administrador, «Nuevo usuario» muestra los selectores de rol (con Tesorero), las dos tarjetas de **Acceso** y
  el campo de contraseña con Generar/Copiar; se creó un Tesorero con contraseña y la tabla lo lista con «Contraseña
  o Google».
- Como Tesorero: entra a «FI Tesorería» (Dashboard con 1 voucher pendiente, Equipos de pago, Salones y ciclos);
  Salones y ciclos muestra «Validar pago y aprobar equipos» y «Rechazar»; «Equipos de pago» no ofrece «Crear
  equipo»; `/admin/usuarios` redirige a `/403`.
- Como Owner (`garias@undc.edu.pe` en el entorno local): los selectores incluyen Administrador y Owner; se añadió un
  Administrador con contraseña, que no puede crear otro Administrador (403) pero sí Tesoreros.
- Pendiente: vista móvil del formulario de acceso y del modal de contraseña; el botón «Acceder con Google» no se
  puede probar en el navegador local.
