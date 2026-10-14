<template>
  <div>
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm text-oscuro-200">{{ scopeLabel(group.scope) }} · {{ group.label }}</p>
        <StatusBadge :status="voucher.status" />
      </div>

      <div class="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <VoucherImage v-if="voucher.imageUrl" :path="voucher.imageUrl" />

        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-xl bg-oscuro-900/60 p-3">
              <p class="text-xs text-oscuro-300">
                {{ voucher.kind === 'BASE' ? 'Monto del pack (total)' : 'Monto del adicional (total)' }}
              </p>
              <p class="mt-1 text-lg font-semibold text-green-400">{{ formatCurrency(Number(voucher.amount)) }}</p>
            </div>
            <div class="rounded-xl bg-oscuro-900/60 p-3">
              <p class="text-xs text-oscuro-300">N° operación</p>
              <p class="mt-1 truncate text-lg font-semibold text-white">{{ voucher.operationNumber || '—' }}</p>
            </div>
          </div>

          <p class="rounded-xl border border-green-500/25 bg-green-500/5 px-3 py-2 text-sm text-oscuro-100">
            <template v-if="voucher.kind === 'BASE'">
              Un solo voucher para todo el pack: cubre {{ rows.length }} equipo(s) y
            </template>
            <template v-else>Voucher propio del equipo adicional:</template>
            <strong class="text-white">se cuenta una sola vez</strong> en la caja, no una vez por equipo.
          </p>

          <p
            v-if="voucher.status === 'REJECTED' && voucher.rejectionReason"
            class="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300"
          >
            Rechazado: {{ voucher.rejectionReason }}
          </p>

          <div>
            <p class="text-sm font-semibold text-white">Equipos que cubre este pago</p>
            <ul class="mt-2 space-y-1.5">
              <li
                v-for="row in rows"
                :key="row.id"
                class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-oscuro-900/60 px-3 py-2"
              >
                <div class="min-w-0">
                  <p class="truncate text-sm text-oscuro-100">
                    <span class="font-semibold text-white">{{ row.discipline }}</span> · {{ row.name }}
                  </p>
                  <p v-if="row.detail" class="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-oscuro-300">
                    <span>{{ playersOf(row.detail) }} jugadores</span>
                    <span
                      v-if="rulesOf(row.detail).ok"
                      class="rounded-md bg-green-500/10 px-1.5 py-0.5 text-green-300"
                    >
                      Cumple las bases
                    </span>
                    <span
                      v-else
                      class="rounded-md bg-red-500/10 px-1.5 py-0.5 text-red-300"
                      :title="rulesOf(row.detail).messages.join(' ')"
                    >
                      Revisar bases: {{ rulesOf(row.detail).messages[0] }}
                    </span>
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <StatusBadge :status="row.status" />
                  <button
                    v-if="row.detail"
                    type="button"
                    class="rounded-lg bg-oscuro-700/60 px-3 py-1 text-xs font-semibold text-oscuro-100 hover:bg-oscuro-700"
                    @click="emit('view-team', row.detail)"
                  >
                    Ver equipo →
                  </button>
                </div>
              </li>
              <li v-if="!rows.length" class="px-1 text-xs text-oscuro-300">Todavía no cubre ningún equipo.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="sticky bottom-0 -mx-5 -mb-4 mt-4 border-t border-oscuro-700 bg-oscuro-850 px-5 py-4">
      <div v-if="voucher.status === 'PENDING'" class="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input
          v-model="reason"
          placeholder="Motivo de rechazo del comprobante"
          class="min-w-0 rounded-lg border border-oscuro-700 bg-oscuro-900/60 px-3 py-2 text-sm text-white"
        />
        <button
          class="rounded-lg bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/25 disabled:opacity-50"
          :disabled="busy || !reason.trim()"
          @click="emit('reject', reason.trim())"
        >
          Rechazar comprobante
        </button>
        <button
          class="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-oscuro-900 hover:bg-green-400 disabled:opacity-50"
          :disabled="busy || !submitted"
          @click="emit('validate')"
        >
          {{ voucher.kind === 'BASE' ? 'Validar pago y aprobar equipos' : 'Validar pago y aprobar equipo' }}
        </button>
        <p v-if="!submitted" class="text-xs text-sky-300 sm:col-span-3">
          El delegado aún no envió ningún equipo: no se puede validar todavía.
        </p>
      </div>
      <div v-else-if="voucher.status === 'VALIDATED'" class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-green-300">
          {{ pendingTeams ? `Pago validado. Faltan ${pendingTeams} equipo(s) por aprobar.` : 'Pago validado: no hay nada pendiente.' }}
        </p>
        <button
          v-if="pendingTeams"
          class="rounded-lg bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-500/25 disabled:opacity-50"
          :disabled="busy"
          @click="emit('validate')"
        >
          Aprobar equipos pendientes
        </button>
      </div>
      <p v-else class="text-sm text-oscuro-300">Comprobante rechazado: se espera que el delegado lo reenvíe.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ClassGroup, GroupVoucher, Team } from '~/types/domain'
import { formatCurrency } from '~/utils/format'
import { scopeLabel, type GroupTeamRow } from '~/utils/groups'

/**
 * Revisión de UN comprobante de un salón o ciclo (pago general o adicional): imagen, monto, N° de operación
 * y los equipos que cubre. No repite datos del equipo ni del grupo (delegado, teléfono, ciclo): esos ya
 * están en el desplegable; cada equipo se revisa en su propio panel.
 */
const props = defineProps<{
  group: ClassGroup
  voucher: GroupVoucher
  /** Equipos que cubre este comprobante. */
  rows: GroupTeamRow[]
  playersOf: (team: Team) => number
  rulesOf: (team: Team) => { ok: boolean; messages: string[] }
  busy: boolean
}>()

const emit = defineEmits<{ validate: []; reject: [reason: string]; 'view-team': [team: Team] }>()

const reason = ref('')

/** Un comprobante solo se valida cuando cubre al menos un equipo ya enviado (no borrador). */
const submitted = computed(() => props.rows.filter((row) => row.status !== 'DRAFT').length)
const pendingTeams = computed(() => props.rows.filter((row) => row.status === 'PENDING').length)
</script>
