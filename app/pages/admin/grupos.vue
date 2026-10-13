<template>
  <div>
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-white">Salones y ciclos</h1>
        <p class="mt-1 max-w-2xl text-sm text-oscuro-300">
          Valida el pago general una sola vez y se aprueban los equipos del salón o ciclo que
          cumplen las reglas. Cada equipo adicional se valida con su propio comprobante.
        </p>
      </div>
      <button
        class="flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300 hover:bg-green-500/20 disabled:opacity-60"
        :disabled="loading || !eventId"
        @click="loadGroups"
      >
        <RefreshCw class="h-4 w-4" /> Actualizar
      </button>
    </div>

    <div class="mt-5 grid gap-3 md:grid-cols-4">
      <label class="block">
        <span class="text-xs text-oscuro-400">Evento (cobro por salón o ciclo)</span>
        <select v-model.number="eventId" class="input" @change="loadGroups">
          <option :value="0" disabled>Selecciona un evento</option>
          <option v-for="event in groupEvents" :key="event.id" :value="event.id">
            {{ event.name }}
          </option>
        </select>
      </label>
      <label class="block">
        <span class="text-xs text-oscuro-400">Escuela</span>
        <select v-model.number="schoolFilter" class="input">
          <option :value="0">Todas</option>
          <option v-for="school in schoolOptions" :key="school.id" :value="school.id">
            {{ school.name }}
          </option>
        </select>
      </label>
      <label class="block">
        <span class="text-xs text-oscuro-400">Ciclo o sección</span>
        <input v-model="textFilter" type="text" class="input" placeholder="Ej. V o A1" />
      </label>
      <label class="block">
        <span class="text-xs text-oscuro-400">Pago general</span>
        <select v-model="statusFilter" class="input">
          <option value="ALL">Todos</option>
          <option value="PENDING">Pendiente</option>
          <option value="VALIDATED">Validado</option>
          <option value="REJECTED">Rechazado</option>
        </select>
      </label>
    </div>

    <div
      v-if="notice"
      class="mt-4 rounded-xl border px-4 py-3 text-sm"
      :class="
        notice.kind === 'error'
          ? 'border-red-500/30 bg-red-500/10 text-red-200'
          : 'border-green-500/30 bg-green-500/10 text-green-200'
      "
    >
      <p>{{ notice.text }}</p>
      <ul v-if="notice.details.length" class="mt-2 list-disc space-y-1 pl-5 text-xs">
        <li v-for="detail in notice.details" :key="detail">{{ detail }}</li>
      </ul>
    </div>

    <p v-if="loading" class="mt-8 text-center text-sm text-oscuro-400">Cargando…</p>
    <p
      v-else-if="eventId && !filteredGroups.length"
      class="mt-8 text-center text-sm text-oscuro-400"
    >
      No hay salones ni ciclos que coincidan con los filtros.
    </p>
    <p v-else-if="!eventId && !groupEvents.length" class="mt-8 text-center text-sm text-oscuro-400">
      Ningún evento cobra todavía por salón o ciclo. Actívalo desde Eventos → Cobro.
    </p>

    <section
      v-for="group in filteredGroups"
      :key="group.id"
      class="mt-5 rounded-2xl border border-oscuro-700 bg-oscuro-850 p-5"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-normal text-green-300">
            {{ scopeLabel(group.scope) }}
          </p>
          <h2 class="mt-1 text-lg font-bold text-white">{{ group.label }}</h2>
          <p class="mt-1 text-xs text-oscuro-400">Delegado: {{ group.delegate.fullName }}</p>
        </div>
        <div class="flex gap-4 text-center text-xs text-oscuro-300">
          <div>
            <p class="text-lg font-bold text-white">{{ teamCount(group) }}</p>
            equipos
          </div>
          <div>
            <p class="text-lg font-bold text-green-400">{{ teamCount(group, 'APPROVED') }}</p>
            aprobados
          </div>
          <div>
            <p class="text-lg font-bold text-yellow-300">{{ teamCount(group, 'PENDING') }}</p>
            pendientes
          </div>
          <div v-if="teamCount(group, 'DRAFT')">
            <p class="text-lg font-bold text-sky-300">{{ teamCount(group, 'DRAFT') }}</p>
            borradores
          </div>
        </div>
      </div>

      <div class="mt-4 space-y-3">
        <div
          v-for="entry in vouchersOf(group)"
          :key="entry.voucher.id"
          class="rounded-xl border border-oscuro-700 bg-oscuro-900/50 p-4"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-white">{{ entry.title }}</p>
              <p class="mt-0.5 text-xs text-oscuro-400">{{ entry.covers }}</p>
            </div>
            <StatusBadge :status="entry.voucher.status" />
          </div>
          <div class="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span class="font-semibold text-green-400">{{ formatCurrency(entry.voucher.amount) }}</span>
            <span class="text-oscuro-300">Operación: {{ entry.voucher.operationNumber || '—' }}</span>
            <VoucherLink :voucher="entry.voucher" :title="entry.title" />
          </div>
          <p
            v-if="entry.voucher.status === 'REJECTED' && entry.voucher.rejectionReason"
            class="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300"
          >
            Rechazado: {{ entry.voucher.rejectionReason }}
          </p>

          <div class="mt-3 flex flex-wrap gap-2">
            <template v-if="entry.voucher.status === 'PENDING'">
              <button
                class="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-oscuro-900 hover:bg-green-400 disabled:opacity-60"
                :disabled="busy || !entry.submitted"
                :title="entry.submitted ? undefined : 'El delegado aún no envió ningún equipo'"
                @click="validateVoucher(group, entry.voucher.id)"
              >
                {{ entry.voucher.kind === 'BASE' ? 'Validar pago y aprobar equipos' : 'Validar y aprobar equipo' }}
              </button>
              <button
                class="rounded-lg bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/25 disabled:opacity-60"
                :disabled="busy"
                @click="askReject(entry.voucher.id)"
              >
                Rechazar
              </button>
            </template>
            <button
              v-else-if="entry.voucher.status === 'VALIDATED'"
              class="rounded-lg bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-500/25 disabled:opacity-60"
              :disabled="busy || !entry.submitted"
              @click="validateVoucher(group, entry.voucher.id)"
            >
              Aprobar equipos pendientes
            </button>
            <p v-else class="text-xs text-oscuro-400">
              Esperando que el delegado reenvíe el comprobante.
            </p>
            <p
              v-if="entry.voucher.status === 'PENDING' && !entry.submitted"
              class="self-center text-xs text-sky-300"
            >
              Esperando que el delegado envíe al menos un equipo.
            </p>
          </div>
        </div>
      </div>

      <h3 class="mt-5 text-sm font-semibold text-oscuro-200">Equipos por disciplina</h3>
      <ul class="mt-2 divide-y divide-oscuro-800">
        <li
          v-for="discipline in group.disciplines.filter((item) => item.teams.length)"
          :key="discipline.disciplineId"
          class="py-3"
        >
          <p class="font-semibold text-white">{{ discipline.name }}</p>
          <ul class="mt-1 space-y-1.5">
            <li
              v-for="team in discipline.teams"
              :key="team.id"
              class="flex flex-wrap items-center gap-2 text-sm text-oscuro-200"
            >
              <span>{{ team.name }}</span>
              <span
                v-if="team.slot"
                class="rounded-md bg-oscuro-900/70 px-2 py-0.5 text-xs text-oscuro-300"
              >
                {{ slotLabel(team.slot) }}
              </span>
              <StatusBadge :status="team.status" />
              <button
                v-if="auth.isAdmin && canApprove(group, team)"
                class="rounded-lg bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300 hover:bg-green-500/25 disabled:opacity-60"
                :disabled="busy"
                @click="approveTeam(team.id, team.name)"
              >
                Aprobar equipo
              </button>
            </li>
          </ul>
        </li>
      </ul>
      <p v-if="!teamCount(group)" class="mt-2 text-xs text-oscuro-400">
        {{
          teamCount(group, 'DRAFT')
            ? 'Solo tiene borradores sin enviar: el pago base se puede validar cuando el delegado envíe al menos un equipo.'
            : 'Todavía no registra equipos: el pago base no se puede validar hasta que haya al menos uno.'
        }}
      </p>
    </section>

    <AppModal v-model="rejectOpen" title="Rechazar comprobante" size="md">
      <form class="space-y-3" @submit.prevent="runReject">
        <p class="text-sm text-oscuro-200">
          El delegado verá el motivo y podrá reenviar el comprobante. Los equipos que este pago
          había aprobado vuelven a pendientes.
        </p>
        <textarea
          v-model="rejectReason"
          required
          rows="3"
          class="input"
          placeholder="Motivo del rechazo"
        />
        <p v-if="rejectError" class="text-sm text-red-400">{{ rejectError }}</p>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg px-4 py-2 text-sm font-semibold text-oscuro-200 hover:bg-oscuro-700"
            @click="rejectOpen = false"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-60"
            :disabled="busy || !rejectReason.trim()"
          >
            Rechazar
          </button>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next'
import type {
  ClassGroup,
  GroupTeam,
  GroupVoucher,
  GroupVoucherValidation,
  RegistrationStatus,
  SportEvent,
  VoucherStatus,
} from '~/types/domain'
import { formatCurrency } from '~/utils/format'
import { apiMessage, scopeLabel, slotLabel } from '~/utils/groups'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const api = useApi()
const auth = useAuthStore()

const events = ref<SportEvent[]>([])
const groups = ref<ClassGroup[]>([])
const eventId = ref(0)
const loading = ref(false)
const busy = ref(false)

const schoolFilter = ref(0)
const textFilter = ref('')
const statusFilter = ref<VoucherStatus | 'ALL'>('ALL')

const notice = ref<{ kind: 'ok' | 'error'; text: string; details: string[] } | null>(null)

const rejectOpen = ref(false)
const rejectVoucherId = ref(0)
const rejectReason = ref('')
const rejectError = ref('')

const groupEvents = computed(() => events.value.filter((e) => e.pricingMode === 'PER_GROUP'))

const schoolOptions = computed(() => {
  const map = new Map<number, string>()
  for (const group of groups.value) map.set(group.school.id, group.school.name)
  return [...map.entries()].map(([id, name]) => ({ id, name }))
})

const filteredGroups = computed(() => {
  const text = textFilter.value.trim().toLowerCase()
  return groups.value.filter((group) => {
    if (schoolFilter.value && group.school.id !== schoolFilter.value) return false
    if (statusFilter.value !== 'ALL' && group.baseVoucher?.status !== statusFilter.value) {
      return false
    }
    if (text && !`${group.cycle} ${group.section} ${group.label}`.toLowerCase().includes(text)) {
      return false
    }
    return true
  })
})

/** Sin `status` cuenta los equipos enviados (los borradores se cuentan aparte). */
function teamCount(group: ClassGroup, status?: RegistrationStatus) {
  return group.disciplines
    .flatMap((discipline) => discipline.teams)
    .filter((team) => (status ? team.status === status : team.status !== 'DRAFT')).length
}

/** Pago general y comprobantes adicionales del grupo, con una descripción de lo que cubren. */
function vouchersOf(
  group: ClassGroup,
): { voucher: GroupVoucher; title: string; covers: string; submitted: number }[] {
  const teams = group.disciplines.flatMap((d) => d.teams.map((t) => ({ team: t, discipline: d.name })))
  const label = (item: { team: GroupTeam; discipline: string }) =>
    `${item.team.name} (${item.discipline}${item.team.status === 'DRAFT' ? ', borrador' : ''})`
  const entries: { voucher: GroupVoucher; title: string; covers: string; submitted: number }[] = []
  if (group.baseVoucher) {
    const covered = teams.filter((item) => item.team.voucherId === group.baseVoucher?.id)
    entries.push({
      voucher: group.baseVoucher,
      title: 'Pago general',
      covers: covered.length ? `Cubre: ${covered.map(label).join(', ')}` : 'Todavía no cubre ningún equipo',
      // Un comprobante solo se puede validar cuando cubre al menos un equipo ya enviado (no borrador).
      submitted: covered.filter((item) => item.team.status !== 'DRAFT').length,
    })
  }
  for (const extra of group.extraVouchers) {
    const covered = teams.filter((item) => extra.teamIds.includes(item.team.id))
    entries.push({
      voucher: extra,
      title: 'Equipo adicional',
      covers: `Cubre: ${covered.map(label).join(', ') || '—'}`,
      submitted: covered.filter((item) => item.team.status !== 'DRAFT').length,
    })
  }
  return entries
}

/** Un equipo pendiente se aprueba a mano cuando el comprobante que lo cubre ya está validado. */
function canApprove(group: ClassGroup, team: GroupTeam) {
  if (team.status !== 'PENDING') return false
  const voucher =
    team.voucherId === group.baseVoucher?.id
      ? group.baseVoucher
      : group.extraVouchers.find((item) => item.id === team.voucherId)
  return voucher?.status === 'VALIDATED'
}

async function loadGroups() {
  if (!eventId.value) return
  loading.value = true
  try {
    groups.value = await api.get<ClassGroup[]>('/groups', { eventId: eventId.value })
  } catch (err) {
    groups.value = []
    notice.value = { kind: 'error', text: apiMessage(err, 'No se pudo cargar la lista.'), details: [] }
  } finally {
    loading.value = false
  }
}

async function validateVoucher(group: ClassGroup, voucherId: number) {
  busy.value = true
  notice.value = null
  try {
    const result = await api.patch<GroupVoucherValidation>(`/vouchers/${voucherId}/validate`, {})
    const names = new Map(group.disciplines.flatMap((d) => d.teams.map((t) => [t.id, t.name] as const)))
    notice.value = {
      kind: 'ok',
      text: `Pago validado. Equipos aprobados: ${result.approvedTeamIds.length}.`,
      details: result.skipped.map(
        (item) => `${names.get(item.teamId) ?? `Equipo #${item.teamId}`}: ${item.reason}`,
      ),
    }
    await loadGroups()
  } catch (err) {
    notice.value = { kind: 'error', text: apiMessage(err, 'No se pudo validar el pago.'), details: [] }
  } finally {
    busy.value = false
  }
}

async function approveTeam(teamId: number, name: string) {
  busy.value = true
  notice.value = null
  try {
    await api.patch(`/registrations/${teamId}/approve`, {})
    notice.value = { kind: 'ok', text: `Equipo ${name} aprobado.`, details: [] }
    await loadGroups()
  } catch (err) {
    notice.value = {
      kind: 'error',
      text: apiMessage(err, `No se pudo aprobar el equipo ${name}.`),
      details: [],
    }
  } finally {
    busy.value = false
  }
}

function askReject(voucherId: number) {
  rejectVoucherId.value = voucherId
  rejectReason.value = ''
  rejectError.value = ''
  rejectOpen.value = true
}

async function runReject() {
  const reason = rejectReason.value.trim()
  if (!reason) return
  busy.value = true
  rejectError.value = ''
  try {
    await api.patch(`/vouchers/${rejectVoucherId.value}/reject`, { reason })
    rejectOpen.value = false
    notice.value = { kind: 'ok', text: 'Comprobante rechazado.', details: [] }
    await loadGroups()
  } catch (err) {
    rejectError.value = apiMessage(err, 'No se pudo rechazar el comprobante.')
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  try {
    events.value = await api.get<SportEvent[]>('/events')
  } catch {
    events.value = []
  }
  if (groupEvents.value.length) {
    eventId.value = groupEvents.value[0]!.id
    await loadGroups()
  }
})
</script>

<style scoped>
.input {
  margin-top: 0.25rem;
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid rgba(55, 65, 81, 0.4);
  background-color: #182029;
  padding: 0.625rem 0.75rem;
  color: white;
  outline: none;
}
.input:focus {
  border-color: #4ade80;
  box-shadow: 0 0 0 1px rgba(74, 222, 128, 0.4);
}
</style>
