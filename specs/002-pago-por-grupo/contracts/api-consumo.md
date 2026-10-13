# Contrato de consumo — Pago por salón o ciclo

Endpoints del backend que consume esta feature. La fuente de verdad es
`backend/specs/002-pago-por-grupo/contracts/pagos-por-grupo.md` y `backend/docs/api-contract.md`.

| Pantalla | Llamada | Uso |
| --- | --- | --- |
| `eventos/[id]` | `GET /events/:id` | `pricingMode` decide la invitación y las tarjetas |
| `eventos/[id]`, hub | `GET /events/:id/pricing` | tarifas (con sesión) |
| hub | `GET /groups/mine?eventId=` | grupos del delegado con vouchers y equipos |
| hub | `POST /groups` (multipart) | `eventId, scope, schoolId, cycle, section?, operationNumber, voucher` |
| hub, `GroupVoucherPanel` | `PATCH /vouchers/:id/replace` (multipart) | `operationNumber, voucher` |
| hub | `GET /faculties` | escuelas de la facultad del evento |
| `inscripcion/[id]` | `GET /groups/:id`, `POST /registrations` (multipart) | `groupId`, `extraVoucherId?`, `voucher?`, `operationNumber?`, `participants` (con `isCaptain` y `dni`) |
| `admin/grupos` | `GET /groups?eventId=` | lista completa; los filtros se aplican en el cliente |
| `admin/grupos` | `PATCH /vouchers/:id/validate` | respuesta `{ …voucher, approvedTeamIds, skipped[{ teamId, reason }] }` |
| `admin/grupos` | `PATCH /vouchers/:id/reject` | `{ reason }` |
| `admin/grupos` | `PATCH /registrations/:id/approve` | equipos pendientes con comprobante validado |
| `admin/eventos` | `GET/PUT /events/:id/pricing` | `{ pricingMode, sectionBase, cycleBase, sectionExtra, cycleExtra }` |
| `estado-inscripcion`, `admin/inscripciones` | `GET /registrations/mine`, `GET /registrations` | los equipos traen `groupId` y `slot` |

Errores: se muestran `err.data.message` (cadena o arreglo) mediante `apiMessage`.
