<template>
  <div>
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 text-sm text-oscuro-200">
        <p v-if="group">
          {{ scopeLabel(group.scope) }} · {{ group.label }}
          <span v-if="coverage" class="text-oscuro-300">› {{ coverage.label }}</span>
        </p>
        <p v-else>
          Delegado: <span class="font-semibold text-white">{{ team.delegate?.fullName || 'Responsable registrado' }}</span>
          <span v-if="team.delegate?.email" class="text-oscuro-300"> · {{ team.delegate.email }}</span>
        </p>
      </div>
      <div class="flex flex-col items-end gap-2">
        <StatusBadge :status="team.status" />
        <button
          v-if="isAdmin && team.status !== 'CANCELLED' && !editing"
          type="button"
          class="rounded-lg bg-oscuro-700/60 px-3 py-1.5 text-xs font-semibold text-oscuro-100 hover:bg-oscuro-700"
          @click="editing = true"
        >
          Editar equipo
        </button>
      </div>
    </div>

    <TeamEditForm
      v-if="editing"
      class="mt-4"
      :team="team"
      admin-mode
      :delegate-options="delegateOptions"
      @saved="onSaved"
      @refresh="emit('saved')"
      @cancel="editing = false"
    />

    <template v-else>
      <div class="mt-4 grid gap-4" :class="ownVoucher ? 'lg:grid-cols-[1fr_0.85fr]' : ''">
        <div class="space-y-4">
          <p
            v-if="isAdmin && team.status === 'APPROVED'"
            class="rounded-lg bg-oscuro-900/60 px-3 py-2 text-xs text-oscuro-200"
          >
            Puedes cambiar jugadores aunque ya esté aprobado: sigue aprobado si cumple las bases y el pago no
            cambia.
          </p>

          <div
            class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold"
            :class="rules.ok ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'"
          >
            <component :is="rules.ok ? CheckCircle2 : AlertTriangle" class="h-4 w-4 shrink-0" />
            {{ rules.ok ? 'El equipo cumple las bases' : 'El equipo necesita revisión' }}
            <span v-if="team.discipline" class="font-normal text-oscuro-200">
              · {{ players }} jugadores (se permiten {{ team.discipline.minPlayers }}-{{ team.discipline.maxPlayers }})
            </span>
          </div>
          <ul v-if="rules.messages.length" class="space-y-1 rounded-xl bg-red-500/5 p-3 text-xs text-red-300">
            <li v-for="message in rules.messages" :key="message" class="flex items-center gap-1.5">
              <AlertTriangle class="h-3 w-3 shrink-0" />
              {{ message }}
            </li>
          </ul>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span class="rounded-lg bg-oscuro-900/70 px-2.5 py-1 text-oscuro-100">
              Tel: {{ team.phone?.trim() || 'Sin teléfono' }}
            </span>
            <span
              v-if="!group && !paid"
              class="rounded-lg bg-green-500/10 px-2.5 py-1 text-green-300"
            >
              Inscripción gratuita: solo requiere cumplir las bases
            </span>
            <template v-if="coverage">
              <span class="rounded-lg bg-oscuro-900/70 px-2.5 py-1 text-oscuro-100">
                Pago: {{ coverage.label.toLowerCase() }} · {{ voucherStateLabel(coverage.voucher.status) }}
              </span>
              <button
                type="button"
                class="font-semibold text-sky-300 hover:text-sky-200"
                @click="emit('view-payment')"
              >
                Ver pago →
              </button>
            </template>
          </div>

          <div>
            <p class="text-sm font-semibold text-white">Jugadores ({{ team.participants.length }})</p>
            <ul class="mt-2 space-y-1 text-sm">
              <li
                v-for="(participant, index) in team.participants"
                :key="participant.studentCode || participant.dni || participant.fullName"
                class="flex items-center justify-between gap-3 rounded-lg bg-oscuro-900/60 px-3 py-1.5"
              >
                <span class="min-w-0 truncate text-oscuro-100">
                  {{ index + 1 }}. {{ participant.fullName }}
                  <span v-if="participant.isCaptain" class="ml-1 rounded-md bg-green-500/10 px-1.5 py-0.5 text-xs text-green-300">
                    Capitán/a
                  </span>
                </span>
                <span class="shrink-0 font-mono text-xs text-oscuro-300">
                  {{ participant.studentCode || '—' }}<template v-if="participant.dni"> · DNI {{ participant.dni }}</template>
                </span>
              </li>
            </ul>
          </div>

          <p
            v-if="team.status === 'REJECTED' && team.rejectionReason"
            class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300"
          >
            Inscripción rechazada: {{ team.rejectionReason }}
          </p>
          <p
            v-if="team.status === 'OBSERVED'"
            class="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm text-orange-200"
          >
            Observado, a la espera de que el delegado lo corrija y lo reenvíe<template v-if="team.observation">:
              {{ team.observation }}</template
            >
          </p>
        </div>

        <div v-if="ownVoucher" class="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div class="flex items-center justify-between gap-3">
            <h3 class="font-bold text-amber-300">Comprobante de pago</h3>
            <StatusBadge v-if="team.voucher" :status="team.voucher.status" />
          </div>
          <template v-if="team.voucher">
            <div class="mt-3 grid grid-cols-2 gap-3">
              <div class="rounded-xl bg-oscuro-900/60 p-3">
                <p class="text-xs text-oscuro-300">Monto</p>
                <p class="mt-1 font-semibold text-green-400">{{ formatCurrency(team.voucher.amount) }}</p>
              </div>
              <div class="rounded-xl bg-oscuro-900/60 p-3">
                <p class="text-xs text-oscuro-300">N° operación</p>
                <p class="mt-1 truncate font-semibold text-white">{{ team.voucher.operationNumber || '—' }}</p>
              </div>
            </div>
            <VoucherImage v-if="team.voucher.imageUrl" class="mt-3" :path="team.voucher.imageUrl" />
            <p
              v-if="team.voucher.status === 'REJECTED' && team.voucher.rejectionReason"
              class="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300"
            >
              Voucher rechazado: {{ team.voucher.rejectionReason }}
            </p>
          </template>
          <p v-else class="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            Este equipo de pago no tiene voucher adjunto.
          </p>
          <VoucherAdminActions
            v-if="isAdmin && team.voucher"
            class="mt-4 border-t border-amber-500/20 pt-3"
            :voucher="team.voucher"
            :busy="busy"
            @reopen="team.voucher && emit('reopen-voucher', team.voucher.id)"
            @edit="team.voucher && emit('edit-voucher', team.voucher.id, $event)"
          />
        </div>
      </div>

      <!-- Administración: corregir el estado, devolver al delegado o eliminar, en cualquier estado -->
      <section
        v-if="isAdmin"
        class="mt-4 space-y-3 rounded-2xl border border-oscuro-700 bg-oscuro-900/40 p-4"
        aria-label="Administración de la inscripción"
      >
        <h3 class="text-sm font-bold text-white">Administración</h3>

        <template v-if="team.status !== 'DRAFT'">
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-if="team.status !== 'PENDING'"
              type="button"
              class="rounded-lg bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/25 disabled:opacity-50"
              :disabled="busy"
              @click="emit('change-status', 'PENDING', '')"
            >
              Volver a pendiente
            </button>
            <button
              v-if="team.status !== 'OBSERVED'"
              type="button"
              class="rounded-lg bg-orange-500/15 px-3 py-1.5 text-xs font-semibold text-orange-300 hover:bg-orange-500/25 disabled:opacity-50"
              :disabled="busy"
              @click="askObservation"
            >
              Marcar observado
            </button>
            <span class="text-xs text-oscuro-300">
              «Observado» devuelve el equipo al delegado para que lo corrija; conserva su cupo y su pago.
            </span>
          </div>

          <div class="grid gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <select v-model="targetStatus" class="field" aria-label="Cambiar a otro estado">
              <option value="">Cambiar estado a…</option>
              <option v-for="option in statusOptions" :key="option" :value="option">
                {{ STATUS_LABEL[option] }}
              </option>
            </select>
            <input
              v-if="needsReason"
              ref="reasonInput"
              v-model="statusReason"
              :placeholder="
                targetStatus === 'OBSERVED' ? 'Observación para el delegado (obligatoria)' : 'Motivo del rechazo (obligatorio)'
              "
              maxlength="500"
              class="field min-w-0"
            />
            <span v-else class="hidden sm:block" />
            <button
              type="button"
              class="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-oscuro-900 hover:bg-green-400 disabled:opacity-50"
              :disabled="busy || !canApplyStatus"
              @click="applyStatus"
            >
              Aplicar
            </button>
          </div>
          <p v-if="targetStatus === 'APPROVED'" class="text-xs text-oscuro-300">
            Para aprobar el equipo debe cumplir las bases y su comprobante debe estar validado.
          </p>
          <p v-if="targetStatus === 'REJECTED' || targetStatus === 'CANCELLED'" class="text-xs text-oscuro-300">
            Libera el cupo del equipo en su salón o ciclo; al restaurarlo se vuelve a tomar si sigue libre.
          </p>
        </template>

        <div class="border-t border-oscuro-700 pt-3">
          <button
            v-if="!confirmingDelete"
            type="button"
            class="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
            :disabled="busy"
            @click="confirmingDelete = true"
          >
            Eliminar inscripción
          </button>
          <div v-else class="rounded-xl border border-red-500/30 bg-red-500/5 p-3">
            <p class="text-sm text-red-200">
              ¿Eliminar definitivamente «{{ team.name }}» ({{ STATUS_LABEL[team.status] ?? team.status }})? Se borran sus
              jugadores y se libera su cupo. No se puede deshacer.
            </p>
            <div class="mt-3 flex justify-end gap-2">
              <button
                type="button"
                class="rounded-lg px-3 py-1.5 text-xs font-semibold text-oscuro-200 hover:bg-oscuro-700"
                :disabled="busy"
                @click="confirmingDelete = false"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="rounded-lg bg-red-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-400 disabled:opacity-50"
                :disabled="busy"
                @click="emit('delete')"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Acciones: Owner/Administrador deciden sobre el equipo; el Tesorero solo valida o rechaza comprobantes -->
      <div
        v-if="showFooter"
        class="sticky bottom-0 -mx-5 -mb-4 mt-4 border-t border-oscuro-700 bg-oscuro-850 px-5 py-4"
      >
        <template v-if="group">
          <div class="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <input
              v-model="reason"
              placeholder="Motivo de rechazo del equipo"
              class="min-w-0 rounded-lg border border-oscuro-700 bg-oscuro-900/60 px-3 py-2 text-sm text-white"
            />
            <button
              class="rounded-lg bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/25 disabled:opacity-50"
              :disabled="busy || !reason.trim()"
              @click="emit('reject', reason.trim())"
            >
              Rechazar equipo
            </button>
            <button
              class="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-oscuro-900 hover:bg-green-400 disabled:opacity-50"
              :disabled="busy || !rules.ok || coverage?.voucher.status !== 'VALIDATED'"
              @click="emit('approve')"
            >
              Aprobar equipo
            </button>
            <p v-if="coverage?.voucher.status !== 'VALIDATED'" class="text-xs text-sky-300 sm:col-span-3">
              Primero se valida el pago ({{ coverage?.label.toLowerCase() ?? 'sin comprobante' }}): el equipo se
              aprueba junto con él.
            </p>
          </div>
        </template>

        <template v-else-if="isTreasurer">
          <div class="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <input
              v-model="reason"
              placeholder="Motivo de rechazo del comprobante"
              class="min-w-0 rounded-lg border border-oscuro-700 bg-oscuro-900/60 px-3 py-2 text-sm text-white"
            />
            <button
              class="rounded-lg bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/25 disabled:opacity-50"
              :disabled="busy || !reason.trim()"
              @click="emit('reject-voucher', reason.trim())"
            >
              Rechazar comprobante
            </button>
            <button
              class="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-oscuro-900 hover:bg-green-400 disabled:opacity-50"
              :disabled="busy || !rules.ok"
              @click="emit('validate-voucher')"
            >
              Validar voucher y aprobar
            </button>
          </div>
        </template>

        <template v-else>
          <div class="grid gap-3">
            <div v-if="paid && team.voucher?.status === 'PENDING'" class="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <input
                v-model="reason"
                placeholder="Motivo de rechazo de inscripción"
                class="min-w-0 rounded-lg border border-oscuro-700 bg-oscuro-900/60 px-3 py-2 text-sm text-white"
              />
              <button
                class="rounded-lg bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/25 disabled:opacity-50"
                :disabled="busy || !reason.trim()"
                @click="emit('reject', reason.trim())"
              >
                Rechazar inscripción
              </button>
              <button
                class="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-oscuro-900 hover:bg-green-400 disabled:opacity-50"
                :disabled="busy || !rules.ok"
                @click="emit('validate-voucher')"
              >
                Validar voucher y aprobar
              </button>
            </div>
            <template v-else>
              <button
                v-if="!paid || team.voucher?.status === 'VALIDATED'"
                class="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-oscuro-900 hover:bg-green-400 disabled:opacity-50"
                :disabled="busy || !rules.ok"
                @click="emit('approve')"
              >
                Aprobar inscripción
              </button>
              <div class="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  v-model="reason"
                  placeholder="Motivo de rechazo de inscripción"
                  class="min-w-0 rounded-lg border border-oscuro-700 bg-oscuro-900/60 px-3 py-2 text-sm text-white"
                />
                <button
                  class="rounded-lg bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/25 disabled:opacity-50"
                  :disabled="busy || !reason.trim()"
                  @click="emit('reject', reason.trim())"
                >
                  Rechazar inscripción
                </button>
              </div>
            </template>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle, CheckCircle2 } from 'lucide-vue-next'
import type {
  AuthUser,
  ClassGroup,
  GroupVoucher,
  RegistrationStatus,
  Team,
  VoucherStatus,
} from '~/types/domain'
import { formatCurrency } from '~/utils/format'
import { scopeLabel } from '~/utils/groups'

/**
 * Revisión de UN equipo: sus jugadores, las reglas y el teléfono, con la edición en el mismo panel (no abre
 * otro modal). No repite lo que ya muestra el desplegable del salón (delegado, ciclo, sección, monto del
 * pack): solo una línea con la ruta y el estado del pago. Un equipo que paga por disciplina trae además su
 * propio comprobante, porque ese voucher es solo suyo.
 */
const props = defineProps<{
  team: Team
  /** Salón o ciclo del equipo; null si paga por disciplina. */
  group: ClassGroup | null
  /** Comprobante del grupo que cubre al equipo y cómo se llama (pack o adicional). */
  coverage: { voucher: GroupVoucher; label: string } | null
  rules: { ok: boolean; messages: string[] }
  players: number
  /** El equipo se paga con comprobante (disciplina de pago o pack del salón). */
  paid: boolean
  isAdmin: boolean
  isTreasurer: boolean
  busy: boolean
  /** Candidatos a delegado para el editor del administrador. */
  delegateOptions?: Pick<AuthUser, 'id' | 'fullName' | 'email'>[]
}>()

const emit = defineEmits<{
  saved: []
  approve: []
  reject: [reason: string]
  'validate-voucher': []
  'reject-voucher': [reason: string]
  'view-payment': []
  'change-status': [status: ManualStatus, reason: string]
  delete: []
  'reopen-voucher': [voucherId: number]
  'edit-voucher': [voucherId: number, data: { operationNumber: string; amount: number }]
}>()

const editing = ref(false)
const reason = ref('')

/** Estados a los que el administrador puede llevar un equipo a mano (el borrador no es un destino). */
type ManualStatus = Exclude<RegistrationStatus, 'DRAFT'>
const MANUAL_STATUSES: ManualStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'OBSERVED', 'CANCELLED']
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  OBSERVED: 'Observado',
  CANCELLED: 'Cancelado',
  DRAFT: 'Borrador',
}

const targetStatus = ref<ManualStatus | ''>('')
const statusReason = ref('')
const confirmingDelete = ref(false)
const reasonInput = ref<HTMLInputElement | null>(null)

const statusOptions = computed(() => MANUAL_STATUSES.filter((status) => status !== props.team.status))
const needsReason = computed(() => targetStatus.value === 'REJECTED' || targetStatus.value === 'OBSERVED')
const canApplyStatus = computed(
  () => !!targetStatus.value && (!needsReason.value || !!statusReason.value.trim()),
)

// Al cambiar de equipo o de estado, el panel parte limpio.
watch(
  () => [props.team.id, props.team.status],
  () => {
    targetStatus.value = ''
    statusReason.value = ''
    confirmingDelete.value = false
  },
)

function applyStatus() {
  if (!targetStatus.value || !canApplyStatus.value) return
  emit('change-status', targetStatus.value, needsReason.value ? statusReason.value.trim() : '')
}

/** «Marcar observado» pide primero el texto que verá el delegado. */
async function askObservation() {
  targetStatus.value = 'OBSERVED'
  await nextTick()
  reasonInput.value?.focus()
}

/** Solo un equipo que paga por disciplina muestra su comprobante aquí; el de un salón se revisa en «Ver pago». */
const ownVoucher = computed(() => !props.group && props.paid)

const showFooter = computed(() => {
  if (props.team.status !== 'PENDING') return false
  if (props.group) return props.isAdmin
  if (props.isTreasurer) return props.paid && props.team.voucher?.status === 'PENDING'
  return props.isAdmin
})

const VOUCHER_STATE: Record<VoucherStatus, string> = {
  PENDING: 'pendiente',
  VALIDATED: 'validado',
  REJECTED: 'rechazado',
}
function voucherStateLabel(status: VoucherStatus) {
  return VOUCHER_STATE[status]
}

function onSaved() {
  editing.value = false
  emit('saved')
}
</script>

<style scoped>
.field {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid rgba(55, 65, 81, 0.4);
  background-color: #182029;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: white;
  outline: none;
}
.field:focus {
  border-color: #4ade80;
  box-shadow: 0 0 0 1px rgba(74, 222, 128, 0.4);
}
</style>
