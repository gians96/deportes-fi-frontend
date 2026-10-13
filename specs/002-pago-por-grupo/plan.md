# Implementation Plan: Pago por salón o ciclo (frontend)

**Branch**: `feat/pago-por-grupo` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

## Summary

El backend (`backend/specs/002-pago-por-grupo`) ya expone tarifas, grupos, cupos, validación en bloque
y re-subida. El frontend agrega un hub por evento, adapta la inscripción por disciplina al modo grupo,
una vista admin de salones y ciclos y el modal de cobro del evento. Todo cuelga de
`SportEvent.pricingMode`: en `PER_DISCIPLINE` nada cambia.

## Technical Context

Nuxt 4 + Vue 3 (`<script setup lang="ts">`) + Tailwind 4, Bun. Sin dependencias nuevas. Acceso a la
API solo por `useApi()`. Sin pruebas automáticas de frontend: se verifica con type-check, build y
prueba manual (ver la evidencia en `spec.md`).

## Verificación contra la constitución

| Principio | Estado |
| --- | --- |
| Contrato del backend como fuente de verdad (`types/domain.ts` lo refleja) | ✅ |
| Todo el acceso a la API por `useApi()`; sin `fetch` directo | ✅ |
| Formularios y confirmaciones con `AppModal`; texto en español | ✅ |
| Sin secretos en `NUXT_PUBLIC_*`, cookies ni almacenamiento; el token del cliente es solo la sesión | ✅ |
| El backend es la autoridad (montos, cupos, nómina); el cliente solo valida para la experiencia | ✅ |

## Decisiones

1. **Hub aparte** (`inscripcion/grupo/[eventId].vue`) en lugar de ampliar `inscripcion/[id].vue`: el
   delegado elige y paga el grupo una vez y desde ahí registra cinco equipos.
2. **`inscripcion/[id].vue` conserva su flujo** y solo cambia si el evento es `PER_GROUP` y llega
   `groupId`; sin `groupId` redirige al hub. Mientras se resuelve el modo no se muestran ciclo/sección.
3. **`paysByGroup(team)`** (`utils/groups.ts`) decide que un equipo se paga con el comprobante del
   grupo; evita depender de `discipline.isPaid`, que en estos eventos queda en gratuito.
4. **Vista admin nueva** (`admin/grupos.vue`) en lugar de sobrecargar `admin/inscripciones.vue`
   (1010 líneas); esta última solo ajusta sus condiciones de pago.
5. **`GroupVoucherPanel`** reutilizable para el pago general y los adicionales.

## Estructura

```text
app/
├── components/GroupVoucherPanel.vue         # NUEVO
├── composables/useApi.ts                    # + put, upload(method)
├── layouts/admin.vue                        # + "Salones y ciclos"
├── pages/
│   ├── inscripcion/grupo/[eventId].vue      # NUEVO (hub)
│   ├── inscripcion/[id].vue                 # modo grupo
│   ├── eventos/[id].vue · disciplinas/[id].vue · estado-inscripcion.vue
│   └── admin/grupos.vue (NUEVO) · eventos.vue (Cobro) · inscripciones.vue
├── types/domain.ts                          # tipos del contrato
└── utils/groups.ts                          # NUEVO: tarifas, cupos, errores, URLs
```
