<template>
  <div>
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Mis inscripciones</h1>
        <p class="mt-1 text-oscuro-300">
          Revisa los equipos donde eres delegado o jugador inscrito.
        </p>
      </div>
      <NuxtLink
        to="/eventos"
        class="rounded-lg bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300 transition hover:bg-green-500/20"
      >
        Ver eventos
      </NuxtLink>
    </div>

    <p
      v-if="notice"
      class="mt-4 flex items-start justify-between gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200"
    >
      <span>{{ notice }}</span>
      <button type="button" class="shrink-0 text-xs font-semibold underline" @click="notice = ''">Cerrar</button>
    </p>

    <div class="mt-5 flex flex-wrap gap-2">
      <button
        v-for="option in statusFilters"
        :key="option.value"
        class="rounded-lg px-3 py-1.5 text-sm font-semibold transition"
        :class="
          statusFilter === option.value
            ? 'bg-green-500/15 text-green-300'
            : 'bg-oscuro-850 text-oscuro-300 hover:bg-oscuro-800'
        "
        @click="statusFilter = option.value"
      >
        {{ option.label }}
      </button>
    </div>

    <div class="mt-3 flex flex-wrap gap-2">
      <button
        v-for="option in paymentFilters"
        :key="option.value"
        class="rounded-lg px-3 py-1.5 text-sm font-semibold transition"
        :class="
          paymentFilter === option.value
            ? 'bg-sky-500/15 text-sky-300'
            : 'bg-oscuro-850 text-oscuro-300 hover:bg-oscuro-800'
        "
        @click="paymentFilter = option.value"
      >
        {{ option.label }}
      </button>
    </div>

    <div class="mt-4 grid gap-3 md:grid-cols-2">
      <label class="block">
        <span class="text-xs text-oscuro-400">Evento</span>
        <select v-model.number="eventFilter" class="input">
          <option :value="0">Todos</option>
          <option v-for="event in availableEvents" :key="event.id" :value="event.id">
            {{ event.name }}
          </option>
        </select>
      </label>
      <label class="block">
        <span class="text-xs text-oscuro-400">Disciplina</span>
        <select v-model.number="disciplineFilter" class="input">
          <option :value="0">Todas</option>
          <option
            v-for="discipline in availableDisciplines"
            :key="discipline.id"
            :value="discipline.id"
          >
            {{ discipline.name }}
          </option>
        </select>
      </label>
    </div>

    <p v-if="!filteredTeams.length" class="mt-8 text-center text-sm text-oscuro-400">
      No hay inscripciones que coincidan con los filtros.
    </p>

    <div class="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="team in filteredTeams"
        :key="team.id"
        class="flex flex-col rounded-3xl border border-oscuro-700 bg-oscuro-850 p-5 shadow-xl shadow-black/10 transition hover:border-green-700/40"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-normal text-green-300">
              {{ team.discipline?.event?.name || 'Evento' }}
            </p>
            <h3 class="mt-1 truncate text-xl font-bold text-white">{{ team.name }}</h3>
            <p class="mt-1 truncate text-sm text-oscuro-400">
              {{ team.discipline?.name || team.disciplineName || 'Disciplina' }}
            </p>
          </div>
          <StatusBadge :status="team.status" />
        </div>

        <div class="my-5 flex items-center justify-between gap-4">
          <div class="text-center">
            <p class="text-xs text-green-400">Jugadores</p>
            <p class="text-4xl font-bold text-green-400">
              {{ team.participants.length }}
            </p>
          </div>
          <div class="h-14 w-px bg-oscuro-700" />
          <div class="flex-1 text-center">
            <p class="text-xs text-oscuro-400">Inscripción</p>
            <p class="mt-1 text-sm font-semibold text-white">
              {{ formatDate(team.createdAt) }}
            </p>
          </div>
        </div>

        <div class="mb-4 flex flex-wrap gap-2 text-xs">
          <span class="rounded-lg bg-green-500/10 px-2.5 py-1 text-green-300">
            {{ team.delegate?.id === auth.user?.id ? 'Soy delegado' : 'Jugador inscrito' }}
          </span>
          <span
            v-if="paysByGroup(team)"
            class="rounded-lg bg-sky-500/10 px-2.5 py-1 text-sky-300"
          >
            {{ team.slot && team.slot > 1 ? 'Equipo adicional' : 'Pago del salón o ciclo' }}
          </span>
          <span
            v-else
            class="rounded-lg px-2.5 py-1"
            :class="
              team.discipline?.isPaid
                ? 'bg-yellow-500/10 text-yellow-300'
                : 'bg-green-500/10 text-green-300'
            "
          >
            {{ team.discipline?.isPaid ? 'De pago' : 'Gratuito' }}
          </span>
          <span
            v-if="team.discipline?.participantType === 'STUDENT'"
            class="rounded-lg bg-oscuro-900/70 px-2.5 py-1 font-semibold text-white"
          >
            {{ teamCycleSection(team) }}
          </span>
        </div>

        <p
          v-if="team.status === 'REJECTED' && team.rejectionReason"
          class="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300"
        >
          {{ team.rejectionReason }}
        </p>

        <div
          v-if="team.status === 'OBSERVED'"
          class="mb-4 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs text-orange-200"
        >
          <p class="font-semibold">El administrador observó tu inscripción</p>
          <p v-if="team.observation" class="mt-1">{{ team.observation }}</p>
          <button
            v-if="canCorrect(team)"
            type="button"
            class="mt-2 rounded-lg bg-orange-500/20 px-3 py-1.5 font-semibold text-orange-100 hover:bg-orange-500/30"
            @click="openCorrect(team)"
          >
            Corregir y reenviar
          </button>
        </div>

        <NuxtLink
          v-if="paysByGroup(team) && team.discipline?.event?.id && team.delegate?.id === auth.user?.id"
          :to="`/inscripcion/grupo/${team.discipline.event.id}`"
          class="mb-3 text-center text-sm font-semibold text-sky-300 hover:text-sky-200"
        >
          Gestionar mi salón o ciclo
        </NuxtLink>

        <button
          class="mt-auto flex w-full items-center justify-between rounded-2xl border border-oscuro-700 bg-oscuro-900/50 px-4 py-2.5 text-sm font-semibold text-oscuro-300 transition hover:border-green-500/40 hover:text-green-300"
          @click="openDetail(team)"
        >
          Ver detalle
          <ChevronRight class="h-4 w-4" />
        </button>
      </article>
    </div>

    <AppModal v-model="detailOpen" :title="detailTeam?.name || 'Detalle de inscripción'" size="4xl">
      <div v-if="detailTeam" class="space-y-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm text-oscuro-400">
              {{ detailTeam.discipline?.event?.name || 'Evento' }} ·
              {{ detailTeam.discipline?.name || detailTeam.disciplineName || 'Disciplina' }}
            </p>
            <p class="mt-1 text-xl font-bold text-white">{{ detailTeam.name }}</p>
          </div>
          <StatusBadge :status="detailTeam.status" />
        </div>

        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-xl bg-oscuro-900/60 p-3">
            <p class="text-xs text-oscuro-400">Delegado</p>
            <p class="mt-1 truncate text-sm font-semibold text-white">
              {{ detailTeam.delegate?.fullName || 'Responsable registrado' }}
            </p>
          </div>
          <div class="rounded-xl bg-oscuro-900/60 p-3">
            <p class="text-xs text-oscuro-400">Ciclo - sección</p>
            <p class="mt-1 text-sm font-semibold text-white">
              {{ teamCycleSection(detailTeam) }}
            </p>
          </div>
          <div class="rounded-xl bg-oscuro-900/60 p-3">
            <p class="text-xs text-oscuro-400">Voucher</p>
            <p class="mt-1 text-sm font-semibold text-white">
              {{ voucherLabel(detailTeam) }}
            </p>
          </div>
        </div>

        <div
          v-if="detailTeam.voucher"
          class="rounded-xl border border-oscuro-700 bg-oscuro-900/40 p-4"
        >
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <p class="text-xs text-oscuro-400">Monto</p>
              <p class="font-semibold text-green-400">
                {{ formatCurrency(detailTeam.voucher.amount) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-oscuro-400">N° operación</p>
              <p class="font-semibold text-white">
                {{ detailTeam.voucher.operationNumber || '—' }}
              </p>
            </div>
          </div>
          <div
            v-if="detailTeam.voucher.imageUrl"
            class="mt-4 overflow-hidden rounded-2xl border border-oscuro-700 bg-black"
          >
            <img
              :src="resolveUrl(detailTeam.voucher.imageUrl)"
              alt="Voucher de pago"
              class="max-h-80 w-full object-contain"
            />
          </div>
          <div v-if="detailTeam.voucher.imageUrl" class="mt-2">
            <VoucherLink :voucher="detailTeam.voucher" label="Ampliar comprobante" />
          </div>
          <div v-else class="mt-4 rounded-lg bg-oscuro-900/70 px-3 py-2 text-sm text-oscuro-300">
            No hay imagen de voucher adjunta.
          </div>
        </div>

        <div class="rounded-xl border border-oscuro-700">
          <div class="flex items-center justify-between border-b border-oscuro-700 px-4 py-3">
            <p class="font-semibold text-white">Jugadores registrados</p>
            <span class="text-xs text-oscuro-400">{{ detailTeam.participants.length }}</span>
          </div>
          <ol class="p-2 text-sm">
            <li
              v-for="(participant, index) in detailTeam.participants"
              :key="participant.id || participant.studentCode || participant.dni || participant.fullName"
              class="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5"
            >
              <span class="min-w-0 truncate text-oscuro-100">
                {{ index + 1 }}. {{ participant.fullName }}
              </span>
              <span class="shrink-0 font-mono text-xs text-oscuro-400">
                {{ participant.studentCode || participant.dni || '—' }}
              </span>
            </li>
          </ol>
        </div>

        <p
          v-if="detailTeam.status === 'REJECTED' && detailTeam.rejectionReason"
          class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          Motivo de rechazo: {{ detailTeam.rejectionReason }}
        </p>
        <p
          v-if="detailTeam.status === 'OBSERVED'"
          class="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm text-orange-200"
        >
          Observación del administrador<template v-if="detailTeam.observation">: {{ detailTeam.observation }}</template>
        </p>
      </div>
    </AppModal>

    <!-- Corrección del delegado: edita y reenvía un equipo observado (sin plazo) -->
    <AppModal
      v-model="correctOpen"
      :title="correctTeam ? `Corregir «${correctTeam.name}»` : 'Corregir inscripción'"
      size="4xl"
    >
      <TeamEditForm
        v-if="correctTeam"
        :key="correctTeam.id"
        :team="correctTeam"
        resubmit
        @saved="onCorrected"
        @refresh="loadTeams"
        @cancel="correctOpen = false"
      />
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import type { RegistrationStatus, Team } from '~/types/domain'
import { useAuthStore } from '~/stores/auth'
import { formatCurrency, formatDate } from '~/utils/format'
import { paysByGroup } from '~/utils/groups'

definePageMeta({ middleware: 'auth' })

const api = useApi()
const auth = useAuthStore()
const config = useRuntimeConfig()

const teams = ref<Team[]>([])
const statusFilter = ref<RegistrationStatus | 'ALL'>('ALL')
const paymentFilter = ref<'ALL' | 'FREE' | 'PAID'>('ALL')
const eventFilter = ref(0)
const disciplineFilter = ref(0)
const detailOpen = ref(false)
const detailTeam = ref<Team | null>(null)
const correctOpen = ref(false)
const correctTeam = ref<Team | null>(null)
const notice = ref('')

const statusFilters: { label: string; value: RegistrationStatus | 'ALL' }[] = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Observados', value: 'OBSERVED' },
  { label: 'Aprobados', value: 'APPROVED' },
  { label: 'Rechazados', value: 'REJECTED' },
]

const paymentFilters: { label: string; value: 'ALL' | 'FREE' | 'PAID' }[] = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Gratuitos', value: 'FREE' },
  { label: 'De pago', value: 'PAID' },
]

const availableEvents = computed(() => {
  const map = new Map<number, string>()
  for (const team of teams.value) {
    const event = team.discipline?.event
    if (event?.id) map.set(event.id, event.name)
  }
  return [...map.entries()].map(([id, name]) => ({ id, name }))
})

const availableDisciplines = computed(() => {
  const map = new Map<number, string>()
  for (const team of teams.value) {
    if (eventFilter.value && team.discipline?.event?.id !== eventFilter.value) continue
    if (team.discipline?.id) map.set(team.discipline.id, team.discipline.name)
  }
  return [...map.entries()].map(([id, name]) => ({ id, name }))
})

watch(eventFilter, () => {
  disciplineFilter.value = 0
})

const filteredTeams = computed(() =>
  teams.value.filter((team) => {
    if (statusFilter.value !== 'ALL' && team.status !== statusFilter.value) return false
    if (paymentFilter.value === 'FREE' && isPaidTeam(team)) return false
    if (paymentFilter.value === 'PAID' && !isPaidTeam(team)) return false
    if (eventFilter.value && team.discipline?.event?.id !== eventFilter.value) return false
    if (disciplineFilter.value && team.discipline?.id !== disciplineFilter.value) return false
    return true
  }),
)

/** De pago: la disciplina cobra por equipo o el equipo se paga con el comprobante de su grupo. */
function isPaidTeam(team: Team) {
  return !!team.discipline?.isPaid || paysByGroup(team)
}

function resolveUrl(path: string) {
  if (path.startsWith('http')) return path
  return config.public.apiBase.replace(/\/api\/v1$/, '') + path
}

function teamCycleSection(team: Team) {
  if (!team.cycle && !team.section) return 'No aplica'
  return `${team.cycle || 's/ciclo'} - ${team.section || 's/sección'}`
}

function voucherLabel(team: Team) {
  if (!team.voucher) return isPaidTeam(team) ? 'Pendiente' : 'No aplica'
  if (team.voucher.status === 'VALIDATED') return 'Validado'
  if (team.voucher.status === 'REJECTED') return 'Rechazado'
  return 'Pendiente'
}

function openDetail(team: Team) {
  detailTeam.value = team
  detailOpen.value = true
}

/** Solo el delegado del equipo corrige un equipo observado (el servidor también lo exige). */
function canCorrect(team: Team) {
  return team.delegate?.id === auth.user?.id
}

function openCorrect(team: Team) {
  correctTeam.value = team
  correctOpen.value = true
}

async function loadTeams() {
  try {
    teams.value = await api.get<Team[]>('/registrations/mine')
  } catch {
    teams.value = []
  }
}

async function onCorrected(resubmitted: boolean) {
  const name = correctTeam.value?.name ?? 'El equipo'
  correctOpen.value = false
  notice.value = resubmitted
    ? `«${name}» se reenvió: el administrador lo revisará de nuevo.`
    : `Cambios de «${name}» guardados. Sigue observado hasta que lo reenvíes.`
  await loadTeams()
}

onMounted(loadTeams)
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
