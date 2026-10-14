# Feature Specification: Revisión por salón o ciclo — desplegables, panel de equipo y panel de pago (frontend)

**Feature Branch**: `fix/comprobante-legibilidad` (renombrar a `feat/revision-por-salon` antes de integrar)

**Created**: 2026-10-14

**Status**: Implementada (2026-10-14)

**Input**: «al aprobar 1 equipo el otro equipo con el que el voucher estaba relacionado se ocultó»; «mostrar el ciclo/salón y dentro el
voucher único para ambos, y los equipos, y aparte el equipo adicional»; «cuando le dé Revisar que muestre solo el equipo, a editar, sin
abrir un segundo modal»; «revisar pago en general del ciclo/sección: que muestre los equipos y el voucher»; «van a haber varios: que
sea un desplegable por inscripción ciclo/sección»; «no tener información duplicada cuando abra modales»; «los textos grises no se ven
bien»; «N° operación sale con los acentos rotos».

**Depende de**: nada nuevo. El backend no cambia (`GET /groups?eventId=`, `GET /registrations`, `PATCH /registrations/:id[/approve|reject]`,
`PATCH /vouchers/:id/validate|reject` ya existen). Es una spec **solo de pantallas**.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Un desplegable por salón o ciclo, con su estado a la vista (Priority: P1)

En Admin → Equipos, los equipos de un salón o ciclo se agrupan en un **desplegable**. Contraído, es una línea: tipo (Salón / Ciclo
completo), escuela y ciclo-sección, conteo de equipos (aprobados y pendientes), pagos del salón (cada voucher una sola vez: total,
validado, por validar) y un aviso de urgencia («N por revisar», «Pago rechazado», «Solo borradores», «Al día»). La lista va ordenada por
urgencia. Abierto, muestra el delegado y su teléfono, el **pack** (el pago general único con los equipos que cubre) y, **aparte**, cada
equipo adicional con su propio comprobante.

**Acceptance Scenarios**:

1. **Given** la pantalla recién abierta, **Then** todos los salones aparecen contraídos y ordenados (pendientes → pago rechazado →
   borradores → al día).
2. **Given** un pack validado que aprobó a dos equipos, **Then** ambos siguen visibles dentro del pack con su estado nuevo (aprobar un
   pago ya no «oculta» a los demás equipos).
3. **Given** un equipo adicional, **Then** aparece fuera del pack, con su ciclo-sección (o «todas las secciones» si es ciclo completo), su
   voucher, su estado y el botón «Revisar y validar pago».
4. **Given** varios salones, **When** se pulsa «Expandir todo» / «Contraer todo», **Then** se abren o cierran todos.
5. **Given** los equipos que pagan por disciplina (sin salón), **Then** siguen como tarjetas bajo «Equipos fuera de un salón o ciclo».

### User Story 2 - «Revisar» muestra solo el equipo, y se edita en el mismo modal (Priority: P1)

El panel del equipo muestra la ruta («Salón · Escuela · V · A › Pack del salón»), el estado, si cumple las bases, el teléfono, un chip del
estado del pago con «Ver pago →» y los jugadores. **Editar equipo** cambia ese mismo panel a modo edición (nombre, celular, agregar o
quitar jugadores, DNI, capitán) con Cancelar y Guardar; no se abre otro modal. Un equipo aprobado sigue aprobado si cumple las bases.

**Acceptance Scenarios**:

1. **Given** un equipo de un salón, **When** se pulsa «Revisar», **Then** el modal no repite delegado, ciclo-sección, monto, N.º de
   operación ni comprobante.
2. **Given** el panel del equipo, **When** se pulsa «Editar equipo», **Then** aparece el formulario dentro del mismo modal (un solo diálogo
   abierto); «Cancelar» vuelve a la vista y «Guardar cambios» guarda y vuelve a la vista con los datos nuevos.
3. **Given** un equipo PENDING cuyo pago del pack ya está validado, **Then** «Aprobar equipo» está habilitado; si el pago no está validado,
   está deshabilitado con el aviso «Primero se valida el pago».
4. **Given** un equipo que paga por disciplina, **Then** su panel incluye su propio comprobante (imagen, monto, N.º de operación) y las
   acciones de siempre (validar voucher y aprobar, rechazar inscripción, aprobar si es gratuito).

### User Story 3 - «Revisar pago» muestra el voucher y los equipos que cubre (Priority: P1)

El panel de pago muestra la imagen del comprobante (clic para ampliar **dentro** del modal), el monto total, el N.º de operación, el estado,
la aclaración «se cuenta una sola vez en la caja» y la lista compacta de equipos cubiertos (disciplina · equipo · jugadores · cumple las
bases · estado) con «Ver equipo →». Acciones: «Validar pago y aprobar equipos» (o «Aprobar equipos pendientes» si ya está validado) y
«Rechazar comprobante» con motivo.

**Acceptance Scenarios**:

1. **Given** el pack de un salón, **When** se pulsa «Revisar pago», **Then** se ve el voucher y los equipos cubiertos, sin datos del delegado.
2. **Given** «Ver equipo →», **Then** el mismo modal cambia al panel del equipo con «← Volver al pago» (nunca dos modales a la vez).
3. **Given** un pago validado, **Then** se muestra «Aprobar equipos pendientes» solo si hay equipos pendientes.
4. **Given** una validación, **Then** un aviso en la página indica los equipos aprobados y, si los hay, los omitidos con su motivo.
5. **Given** un comprobante que aún no cubre ningún equipo enviado, **Then** «Validar» está deshabilitado con su explicación.
6. **Given** dos paneles abiertos (pago → equipo), **When** se pulsa «Atrás» del navegador (o el gesto de retroceso), **Then** se vuelve al
   panel anterior; **When** se pulsa otra vez desde el primer panel, **Then** solo se cierra el modal. En ningún caso se sale de la pantalla.
7. **Given** un segundo panel, **Then** la cabecera del modal muestra un botón visible «← Volver al pago» (o «← Volver al equipo»; «Atrás» en
   móvil) que hace lo mismo que «Atrás».
8. **Given** un modal con varios paneles, **When** se cierra con la X, el fondo, Esc o tras una acción, **Then** el historial queda como
   antes de abrirlo (un «Atrás» posterior va a la página anterior, no reabre el modal), y la lista conserva su posición.

### User Story 4 - El Tesorero ve los equipos que pagan por salón (Priority: P1)

El filtro «De pago» (el que el Tesorero trae por defecto) se aplica en el cliente con `needsVoucher` (disciplina de pago **o** equipo de un
salón). Antes se pedía `?isPaid=true` al servidor, que mira solo `discipline.isPaid`, y un Tesorero no veía los equipos de una disciplina con
`isPaid = false` aunque su salón pagara por grupo (ni su comprobante adicional).

**Acceptance Scenarios**:

1. **Given** un salón con disciplinas `isPaid = true` y `isPaid = false`, **When** entra el Tesorero con «De pago», **Then** ve los equipos de ambas.
2. **Given** el rol Tesorero, **Then** no tiene «Editar equipo» ni aprobar/rechazar equipos; sí «Validar» y «Rechazar comprobante».

### User Story 5 - Textos legibles y con acentos correctos (Priority: P2)

Los tonos grises de texto del tema (`oscuro-300/400/500`) cumplen contraste ≥ 4.5:1 sobre los fondos del panel, y no quedan textos con la
codificación rota («NÂ° operaciÃ³n», «â€”»).

## Requirements *(mandatory)*

- **FR-001**: Los equipos con `groupId` se muestran solo dentro del desplegable de su salón (con los datos de `GET /groups`); un equipo cuyo
  grupo no se pudo cargar sigue apareciendo como tarjeta suelta (no se pierde ninguno).
- **FR-002**: Un salón aparece en una pestaña de estado si alguno de sus equipos (ya filtrado por la pantalla) tiene ese estado; dentro se
  ven todos sus equipos con su estado actual.
- **FR-003**: Existe un único modal de revisión con dos paneles (equipo y pago); cambiar de panel no apila modales. Ampliar el comprobante es
  una acción dentro del panel (`VoucherImage`), no otro modal.
- **FR-003b**: El estado del modal vive en el historial del navegador mediante el parámetro `revision` (número de paneles abiertos, con
  `router.push`); «Atrás», `router.back()` y el botón ← de `AppModal` (`back-label`) descartan el panel visible, y cerrar retira todas las
  entradas (`router.go(-n)`). Un enlace recargado con `?revision=` no abre nada: el parámetro se limpia.
- **FR-004**: Cada dato se muestra en un solo lugar: delegado, ciclo-sección y caja del salón en el desplegable; monto, N.º de operación e
  imagen en el panel de pago; jugadores y reglas en el panel del equipo.
- **FR-005**: La caja de un salón suma cada voucher una sola vez (BASE y EXTRA), nunca por equipo cubierto.
- **FR-006**: Las acciones respetan el rol (Owner/Administrador deciden; el Tesorero solo valida o rechaza comprobantes) y los errores del
  servidor se muestran tal cual (`err.data.message`) dentro del modal.
- **FR-007**: Tras una acción, la revisión y la lista reflejan el estado nuevo sin recargar la página; si el elemento revisado deja de estar
  en la lista, el modal se cierra.
- **FR-008**: Los textos de UI están en español y usan los tokens `oscuro-*` (contraste ≥ 4.5:1); el diseño no desborda a 390 px de ancho.

### Edge Cases

- Salón sin comprobante del pago general: el pack lo indica («todavía no tiene comprobante») y no ofrece «Revisar pago».
- Equipos rechazados o cancelados de un salón (sin pago vigente): aparecen en «Otros equipos».
- Un equipo oculto por los filtros del servidor (disciplina, escuela…) se lista sin botón «Revisar».
- Filtro «Gratuitos»: no muestra salones (todos sus equipos pagan por comprobante).

## Success Criteria

- **SC-001**: Con un salón de dos equipos y un pago, aprobar el pago deja a ambos visibles y aprobados en la misma pantalla.
- **SC-002**: En ningún paso de la revisión hay más de un `[role=dialog]` abierto.
- **SC-003**: Los conteos por pestaña no pierden ni duplican equipos (equipos sueltos + equipos dentro de salones = total).

## Evidencia de verificación (2026-10-14)

Contra el backend local (3030) con una copia de la base de producción en MariaDB (Docker, 127.0.0.1:3311), como Owner y como Tesorero.

- `vue-tsc` (`npx --yes -p typescript@5.9.3 -p vue-tsc@3.1.8 vue-tsc -b --noEmit`): 10 errores, los mismos previos (`fixture.vue`,
  `nuxt.config.ts`, `utils/sports.ts`); ninguno nuevo. `bun run build` sin errores.
- Desplegables: contraídos al abrir, ordenados por urgencia; cabecera con «3 equipos · 2 aprobados · 1 pendiente» y pagos
  «S/ 120.00 · validado S/ 100.00 · por validar S/ 20.00»; «Expandir todo / Contraer todo» presentes.
- Conteos por pestaña (desplegables + tarjetas sueltas): Pendientes 1 + 0, Aprobados 1 + 48, Rechazados 0 + 5, Todos 1 + 53 (56 equipos).
- Panel del equipo («Futsal · Los mismos»): sin monto, sin comprobante y sin delegado; chip «Pago: pack del salón · validado».
  «Editar equipo» abre el formulario en el mismo modal (1 diálogo); «Cancelar» vuelve; «Guardar cambios» sobre un equipo aprobado vuelve a
  la vista y **sigue APROBADO**.
- Panel de pago: imagen, «Monto del pack (total)», «cubre 2 equipos», 2 botones «Ver equipo →»; «Ver equipo →» → «← Volver al pago» →
  panel de pago, siempre con 1 diálogo.
- Validar el pack de un salón de prueba: aviso «Pago validado. Equipos aprobados: 2.» y el salón pasa a «2 aprobados · 1 pendiente». Rechazar
  el adicional: exige motivo, aviso «Comprobante rechazado…» y su estado queda RECHAZADO. El salón de prueba se borró al terminar y la
  copia quedó como antes (2 eventos, 1 grupo, 56 equipos, 55 vouchers).
- Tesorero: panel del equipo solo lectura (único botón «Ver pago →»); en un comprobante pendiente tiene «Rechazar comprobante» y «Validar
  pago y aprobar equipo»; el filtro «De pago» le muestra ambos salones. Con el filtro anterior solo veía «Los mismos (Futsal)» y no el
  adicional de Básquet.
- Historial: pago → equipo → «Atrás» del navegador vuelve al pago (`?revision=1`) y otro «Atrás» cierra el modal, siempre en
  `/admin/inscripciones`; el botón ← de la cabecera hace lo mismo; cerrar con la X desde el 2.º panel deja la URL limpia y un «Atrás»
  posterior va al Panel (sin entradas de más); `?revision=2` recargado se limpia sin abrir nada; la posición de la lista se conserva (900 px
  antes, durante y después).
- Móvil (390 px): sin desbordes horizontales con la lista, el desplegable abierto y el modal de pago.
- Nota de entorno: con el panel del navegador oculto la animación de cierre del modal no termina (queda `modal-leave-active`); no es un
  fallo de la pantalla.
