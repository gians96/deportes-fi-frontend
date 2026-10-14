<template>
  <div>
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-white">Inscripciones</h1>
        <p class="mt-1 text-sm text-oscuro-300">
          Gestiona equipos gratuitos y de pago desde una sola pantalla.
        </p>
      </div>
      <button
        v-if="auth.isAdmin"
        class="shrink-0 rounded-lg bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300 hover:bg-green-500/20"
        @click="openCreate"
      >
        Crear equipo
      </button>
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <button
        v-for="option in filters"
        :key="option.value"
        class="rounded-lg px-3 py-1.5 text-sm font-semibold transition"
        :class="
          filter === option.value
            ? 'bg-green-500/15 text-green-300'
            : 'bg-oscuro-850 text-oscuro-300 hover:bg-oscuro-800'
        "
        @click="filter = option.value"
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

    <div class="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <label class="block">
        <span class="text-xs text-oscuro-400">Evento</span>
        <select v-model.number="adv.eventId" class="input">
          <option :value="0">Todos</option>
          <option v-for="event in events" :key="event.id" :value="event.id">
            {{ event.name }}
          </option>
        </select>
      </label>
      <label class="block">
        <span class="text-xs text-oscuro-400">Facultad</span>
        <select v-model.number="adv.facultyId" class="input">
          <option :value="0">Todas</option>
          <option v-for="faculty in faculties" :key="faculty.id" :value="faculty.id">
            {{ faculty.name }}
          </option>
        </select>
      </label>
      <label class="block">
        <span class="text-xs text-oscuro-400">Escuela profesional</span>
        <select v-model.number="adv.schoolId" class="input">
          <option :value="0">Todas</option>
          <option v-for="school in filterSchools" :key="school.id" :value="school.id">
            {{ school.name }}
          </option>
        </select>
      </label>
      <label class="block">
        <span class="text-xs text-oscuro-400">Disciplina</span>
        <select v-model.number="adv.disciplineId" class="input">
          <option :value="0">Todas</option>
          <option v-for="discipline in disciplines" :key="discipline.id" :value="discipline.id">
            {{ discipline.name }}
          </option>
        </select>
      </label>
      <label class="block">
        <span class="text-xs text-oscuro-400">Tipo de participante</span>
        <select v-model="adv.participantType" class="input">
          <option value="ALL">Todos</option>
          <option value="STUDENT">Solo estudiantes</option>
          <option value="OTHER">Otros</option>
        </select>
      </label>
    </div>

    <p v-if="!visibleCount" class="mt-8 text-center text-sm text-oscuro-400">
      No hay equipos que coincidan con los filtros.
    </p>

    <div
      v-if="notice"
      class="mt-4 rounded-xl border px-4 py-3 text-sm"
      :class="
        notice.kind === 'error'
          ? 'border-red-500/30 bg-red-500/10 text-red-200'
          : 'border-green-500/30 bg-green-500/10 text-green-200'
      "
    >
      <div class="flex items-start justify-between gap-3">
        <p>{{ notice.text }}</p>
        <button type="button" class="shrink-0 text-xs font-semibold underline" @click="notice = null">Cerrar</button>
      </div>
      <ul v-if="notice.details.length" class="mt-2 list-disc space-y-1 pl-5 text-xs">
        <li v-for="detail in notice.details" :key="detail">{{ detail }}</li>
      </ul>
    </div>

    <div v-if="groupCards.length" class="mt-6">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-sm font-semibold uppercase tracking-normal text-oscuro-200">
          Salones y ciclos ({{ groupCards.length }})
        </h2>
        <div class="flex gap-2 text-xs">
          <button
            type="button"
            class="rounded-lg bg-oscuro-850 px-3 py-1.5 font-semibold text-oscuro-100 hover:bg-oscuro-800"
            @click="expandAll"
          >
            Expandir todo
          </button>
          <button
            type="button"
            class="rounded-lg bg-oscuro-850 px-3 py-1.5 font-semibold text-oscuro-100 hover:bg-oscuro-800"
            @click="collapseAll"
          >
            Contraer todo
          </button>
        </div>
      </div>
      <div class="mt-3 space-y-3">
        <GroupAccordion
          v-for="group in groupCards"
          :key="group.id"
          :group="group"
          :teams-by-id="teamsById"
          :players-of="countedPlayers"
          :rules-of="rulesCheck"
          :open="isGroupOpen(group.id)"
          @toggle="toggleGroup(group.id)"
          @review-team="openReview"
          @review-payment="openPayment(group.id, $event)"
        />
      </div>
    </div>

    <h2
      v-if="groupCards.length && individualTeams.length"
      class="mt-8 text-sm font-semibold uppercase tracking-normal text-oscuro-200"
    >
      Equipos fuera de un salón o ciclo
    </h2>

    <div v-if="individualTeams.length" class="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="team in individualTeams"
        :key="team.id"
        class="flex flex-col rounded-3xl border border-oscuro-700 bg-oscuro-850 p-5 transition-all hover:border-green-700/40 hover:shadow-2xl hover:shadow-green-900/10"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-start gap-3">
            <span
              class="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              :class="getSportMeta(team.discipline?.name).bg"
            >
              <component
                :is="getSportMeta(team.discipline?.name).icon"
                class="h-6 w-6"
                :class="getSportMeta(team.discipline?.name).color"
              />
            </span>
            <div class="min-w-0">
              <p class="truncate text-lg font-bold text-white">{{ team.name }}</p>
              <p class="truncate text-xs text-oscuro-400">
                {{ team.discipline?.name || team.disciplineName }}
              </p>
            </div>
          </div>
          <StatusBadge :status="team.status" />
        </div>

        <div class="mt-4 space-y-1.5 text-xs text-oscuro-300">
          <p class="flex items-center gap-2">
            <CalendarRange class="h-3.5 w-3.5 text-oscuro-500" />
            <span class="truncate">{{ team.discipline?.event?.name || '—' }}</span>
          </p>
          <p class="flex items-center gap-2">
            <Building2 class="h-3.5 w-3.5 text-oscuro-500" />
            <span class="truncate">{{ team.discipline?.event?.faculty?.name || '—' }}</span>
          </p>
          <p class="flex items-center gap-2">
            <GraduationCap class="h-3.5 w-3.5 text-oscuro-500" />
            <span class="truncate">{{ team.discipline?.event?.school?.name || 'Todas las escuelas' }}</span>
          </p>
        </div>

        <div class="my-5 flex items-center justify-between gap-4">
          <div class="text-center">
            <p class="text-xs text-green-400">Participantes</p>
            <p class="text-4xl font-bold text-green-400">
              {{ countedPlayers(team) }}
            </p>
            <p class="text-[11px] text-oscuro-500">
              {{ team.participants.length }} registrados
            </p>
          </div>
          <div class="h-14 w-px bg-oscuro-700" />
          <div class="flex-1 text-center">
            <p class="text-xs text-oscuro-400">Validación de reglas</p>
            <p
              class="mt-1 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
              :class="
                rulesCheck(team).ok
                  ? 'bg-green-500/10 text-green-300'
                  : 'bg-red-500/10 text-red-300'
              "
            >
              <component :is="rulesCheck(team).ok ? CheckCircle2 : AlertTriangle" class="h-3.5 w-3.5" />
              {{ rulesCheck(team).ok ? 'Cumple' : 'Revisar' }}
            </p>
          </div>
        </div>

        <div v-if="team.discipline" class="mb-3 flex flex-wrap gap-2 text-xs">
          <span
            v-if="team.delegate"
            class="rounded-lg bg-green-500/10 px-2.5 py-1 text-green-300"
          >
            Delegado: {{ team.delegate.fullName }}
          </span>
          <span class="rounded-lg bg-oscuro-900/70 px-2.5 py-1 text-oscuro-300">
            Tel: {{ teamPhoneLabel(team) }}
          </span>
          <span class="rounded-lg bg-oscuro-900/70 px-2.5 py-1 text-oscuro-300">
            {{ participantTypeLabel(team.discipline.participantType) }}
          </span>
          <span
            class="rounded-lg px-2.5 py-1"
            :class="
              needsVoucher(team)
                ? 'bg-yellow-500/10 text-yellow-300'
                : 'bg-green-500/10 text-green-300'
            "
          >
            {{ needsVoucher(team) ? voucherBadge(team) : 'Gratuito' }}
          </span>
          <span class="rounded-lg bg-oscuro-900/70 px-2.5 py-1 text-oscuro-300">
            Base: {{ team.discipline.minPlayers }}-{{ team.discipline.maxPlayers }}
          </span>
          <span
            v-if="team.discipline.participantType === 'STUDENT'"
            class="rounded-lg bg-oscuro-900/70 px-2.5 py-1 font-semibold text-white"
          >
            Ciclo - Sección: {{ teamCycleSection(team) }}
          </span>
        </div>

        <ul
          v-if="rulesCheck(team).messages.length"
          class="mb-3 space-y-1 rounded-lg bg-red-500/5 px-3 py-2 text-xs text-red-300"
        >
          <li v-for="message in rulesCheck(team).messages" :key="message" class="flex items-center gap-1.5">
            <AlertTriangle class="h-3 w-3 shrink-0" />
            {{ message }}
          </li>
        </ul>

        <button
          class="mt-auto flex w-full items-center justify-between rounded-2xl border border-oscuro-700 bg-oscuro-900/50 px-4 py-2.5 text-sm font-semibold text-oscuro-300 transition-all hover:border-green-500/40 hover:text-green-300"
          @click="openReview(team)"
        >
          <span class="flex items-center gap-2">
            <component :is="needsVoucher(team) ? ReceiptText : Users" class="h-4 w-4" />
            {{ needsVoucher(team) ? 'Revisar voucher' : 'Revisar equipo' }}
          </span>
          <ChevronRight class="h-4 w-4" />
        </button>

        <p
          v-if="team.status === 'REJECTED' && team.rejectionReason"
          class="mt-3 rounded-lg bg-red-500/5 px-3 py-2 text-xs text-red-300"
        >
          Motivo: {{ team.rejectionReason }}
        </p>
      </article>
    </div>

    <!-- Un solo modal con dos paneles (equipo / pago de un salón): se cambia de panel, nunca se apilan modales -->
    <AppModal
      v-model="reviewOpen"
      :title="reviewTitle"
      :size="reviewSize"
      :back-label="reviewBackLabel"
      @back="backReview"
    >
      <p v-if="reviewError" class="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
        {{ reviewError }}
      </p>
      <TeamReviewPane
        v-if="review?.view === 'team' && reviewTeam"
        :key="`team-${reviewTeam.id}`"
        :team="reviewTeam"
        :group="reviewTeamGroup"
        :coverage="reviewTeamCoverage"
        :rules="rulesCheck(reviewTeam)"
        :players="countedPlayers(reviewTeam)"
        :paid="needsVoucher(reviewTeam)"
        :is-admin="auth.isAdmin"
        :is-treasurer="auth.isTreasurer"
        :busy="busy"
        @saved="onTeamEdited"
        @approve="approveReview"
        @reject="rejectReview"
        @validate-voucher="validateTeamVoucher"
        @reject-voucher="rejectTeamVoucher"
        @view-payment="goToPayment"
      />
      <PaymentReviewPane
        v-else-if="review?.view === 'payment' && paymentContext"
        :key="`pago-${paymentContext.voucher.id}`"
        :group="paymentContext.group"
        :voucher="paymentContext.voucher"
        :rows="paymentContext.rows"
        :players-of="countedPlayers"
        :rules-of="rulesCheck"
        :busy="busy"
        @validate="validateGroupPayment"
        @reject="rejectGroupPayment"
        @view-team="viewTeamFromPayment"
      />
    </AppModal>

    <AppModal v-model="createOpen" title="Crear equipo manualmente">
      <form class="grid gap-4" @submit.prevent="submitCreate">
        <label class="block">
          <span class="text-sm text-oscuro-200">Disciplina</span>
          <select v-model.number="createForm.disciplineId" required class="input">
            <option :value="0" disabled>Selecciona...</option>
            <option v-for="discipline in disciplines" :key="discipline.id" :value="discipline.id">
              {{ discipline.name }} ·
              {{ discipline.participantType === 'OTHER' ? 'Otros' : 'Solo estudiantes' }}
              · {{ discipline.isPaid ? formatCurrency(discipline.cost) : 'Gratuito' }}
              <template v-if="discipline.event"> · {{ discipline.event.name }}</template>
            </option>
          </select>
          <span v-if="!disciplines.length" class="mt-1 block text-xs text-amber-400">
            No hay disciplinas activas para el filtro seleccionado.
          </span>
        </label>

        <label class="block">
          <span class="text-sm text-oscuro-200">Nombre del equipo</span>
          <input v-model="createForm.teamName" required class="input" />
        </label>

        <label class="block">
          <span class="text-sm text-oscuro-200">Teléfono (opcional)</span>
          <input v-model="createForm.phone" class="input" />
        </label>

        <label class="block">
          <span class="text-sm text-oscuro-200">Delegado responsable</span>
          <select v-model.number="createForm.delegateId" required class="input">
            <option :value="0" disabled>Selecciona un usuario</option>
            <option v-for="user in delegateOptions" :key="user.id" :value="user.id">
              {{ user.fullName }} · {{ user.email }}
            </option>
          </select>
          <span class="mt-1 block text-xs text-oscuro-400">
            Esta persona podrá ver y gestionar la inscripción.
          </span>
        </label>

        <div v-if="participantMode === 'STUDENT'" class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm text-oscuro-200">Ciclo</span>
            <input v-model="createForm.cycle" class="input" placeholder="Ej. VIII" />
          </label>
          <label class="block">
            <span class="text-sm text-oscuro-200">Sección</span>
            <input v-model="createForm.section" class="input" placeholder="Ej. A" />
          </label>
        </div>

        <div class="rounded-lg border border-oscuro-700 p-3">
          <span class="text-sm font-semibold text-oscuro-200">Integrantes</span>
          <p class="mt-1 text-xs text-oscuro-400">
            {{
              participantMode === 'OTHER'
                ? 'Busca por DNI (8 dígitos) en RENIEC.'
                : 'Busca por código de estudiante en el padrón.'
            }}
            El delegado responsable se elige aparte y no cuenta como jugador.
          </p>
          <p v-if="selectedDiscipline" class="mt-1 text-xs text-green-300">
            Jugadores para bases: {{ createCountedPlayers }} /
            {{ selectedDiscipline.minPlayers }}-{{ selectedDiscipline.maxPlayers }}
          </p>
          <div class="mt-2 flex gap-2">
            <input
              v-model="participantSearch"
              :placeholder="participantMode === 'OTHER' ? 'DNI (8 dígitos)' : 'Código de estudiante'"
              :inputmode="participantMode === 'OTHER' ? 'numeric' : 'text'"
              class="input flex-1"
              @keydown.enter.prevent="searchParticipant"
            />
            <button
              type="button"
              class="rounded-lg bg-green-500/15 px-3 text-sm font-semibold text-green-300 hover:bg-green-500/25"
              :disabled="searching"
              @click="searchParticipant"
            >
              Agregar
            </button>
          </div>
          <p v-if="participantError" class="mt-1 text-xs text-red-400">{{ participantError }}</p>
          <ul v-if="createForm.participants.length" class="mt-2 space-y-1">
            <li
              v-for="(participant, index) in createForm.participants"
              :key="participant.studentCode || participant.dni || participant.fullName"
              class="flex items-center justify-between rounded px-2 py-1 text-sm text-oscuro-200"
            >
              <span>
                {{ participant.fullName }}
                <span class="text-xs text-oscuro-400">
                  · {{ participant.studentCode || participant.dni || 's/d' }}
                </span>
              </span>
              <button
                type="button"
                class="text-xs text-red-400 hover:text-red-300"
                @click="removeParticipant(index)"
              >
                Quitar
              </button>
            </li>
          </ul>
        </div>

        <div
          v-if="selectedDiscipline?.isPaid"
          class="grid gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"
        >
          <span class="text-sm font-semibold text-amber-300">
            Comprobante de pago ({{ formatCurrency(selectedDiscipline.cost) }})
          </span>
          <label class="block">
            <span class="text-xs text-oscuro-300">N° de operación</span>
            <input v-model="createForm.operationNumber" class="input" />
          </label>
          <label class="block">
            <span class="text-xs text-oscuro-300">Imagen del voucher</span>
            <input type="file" accept="image/*" class="input" @change="onVoucher" />
          </label>
        </div>

        <p v-if="modalError" class="text-sm text-red-400">{{ modalError }}</p>
        <button
          type="submit"
          class="rounded-lg bg-green-500 px-5 py-2.5 font-semibold text-oscuro-900 hover:bg-green-400 disabled:opacity-50"
          :disabled="submitting"
        >
          {{ submitting ? 'Creando...' : 'Crear equipo' }}
        </button>
      </form>
    </AppModal>

  </div>
</template>

<script setup lang="ts">
import {
  AlertTriangle,
  Building2,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  ReceiptText,
  Users,
} from 'lucide-vue-next'
import type {
  AcademicStudent,
  AuthUser,
  ClassGroup,
  Discipline,
  GroupVoucherValidation,
  Participant,
  ParticipantType,
  RegistrationStatus,
  SportEvent,
  Team,
} from '~/types/domain'
import { formatCurrency } from '~/utils/format'
import { ATTENTION_ORDER, apiMessage, coverageOf, groupAttention, groupTeamRows } from '~/utils/groups'
import {
  countedParticipants,
  participantTypeLabel,
} from '~/utils/participants'
import { getSportMeta } from '~/utils/sports'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const api = useApi()
const auth = useAuthStore()
const config = useRuntimeConfig()
const teams = ref<Team[]>([])
const filter = ref<RegistrationStatus | 'ALL'>('PENDING')
const paymentFilter = ref<'ALL' | 'FREE' | 'PAID'>(
  route.query.payment === 'PAID' || auth.isTreasurer ? 'PAID' : 'ALL',
)

const events = ref<SportEvent[]>([])
const users = ref<AuthUser[]>([])
const { faculties, load: loadFaculties } = useFaculties()

const adv = reactive({
  eventId: 0,
  facultyId: 0,
  schoolId: 0,
  disciplineId: 0,
  participantType: 'ALL' as ParticipantType | 'ALL',
})

const filterSchools = computed(
  () => faculties.value.find((faculty) => faculty.id === adv.facultyId)?.schools ?? [],
)

watch(
  () => adv.facultyId,
  () => {
    adv.schoolId = 0
  },
)

watch(
  () => [adv.eventId, adv.facultyId, adv.schoolId, adv.disciplineId, adv.participantType],
  () => {
    loadTeams()
    loadDisciplines()
  },
)

const filters = computed<{ label: string; value: RegistrationStatus | 'ALL' }[]>(() => [
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Aprobados', value: 'APPROVED' },
  { label: 'Rechazados', value: 'REJECTED' },
  // El Tesorero no recibe borradores: el filtro solo tiene sentido para Owner y Administrador.
  ...(auth.isAdmin ? [{ label: 'Borradores', value: 'DRAFT' as const }] : []),
  { label: 'Todos', value: 'ALL' },
])

const paymentFilters: { label: string; value: 'ALL' | 'FREE' | 'PAID' }[] = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Gratuitos', value: 'FREE' },
  { label: 'De pago', value: 'PAID' },
]

/**
 * El filtro de pago se aplica aquí y no en el servidor: `GET /registrations?isPaid=` mira solo
 * `discipline.isPaid`, y en un evento por salón o ciclo el pago va por el comprobante del grupo
 * (una disciplina puede tener `isPaid = false` y sus equipos igual deben pagar). Así el Tesorero,
 * que entra con «De pago», no deja de ver equipos con comprobante por revisar.
 */
const filtered = computed(() => {
  const byStatus =
    filter.value === 'ALL'
      ? teams.value
      : teams.value.filter((team) => team.status === filter.value)
  if (paymentFilter.value === 'PAID') return byStatus.filter((team) => needsVoucher(team))
  if (paymentFilter.value === 'FREE') return byStatus.filter((team) => !needsVoucher(team))
  return byStatus
})

/**
 * Los equipos de un salón o ciclo se muestran juntos en una tarjeta del grupo (su pago general único,
 * los equipos que cubre y, aparte, cada equipo adicional con su comprobante). Así aprobar el pago no
 * hace "desaparecer" a los demás equipos del pack: siguen a la vista con su nuevo estado.
 */
const groups = ref<ClassGroup[]>([])
const teamsById = computed(() => new Map(teams.value.map((team) => [team.id, team] as const)))
const groupedTeamIds = computed(
  () =>
    new Set(groups.value.flatMap((group) => group.disciplines.flatMap((d) => d.teams.map((t) => t.id)))),
)

/** Una tarjeta de grupo aparece si alguno de sus equipos (ya filtrado por la pantalla) está en la pestaña. */
const groupCards = computed(() => {
  if (paymentFilter.value === 'FREE') return []
  return groups.value
    .filter((group) =>
      group.disciplines.some((discipline) =>
        discipline.teams.some(
          (team) =>
            teamsById.value.has(team.id) && (filter.value === 'ALL' || team.status === filter.value),
        ),
      ),
    )
    .sort(
      (a, b) =>
        ATTENTION_ORDER[groupAttention(a)] - ATTENTION_ORDER[groupAttention(b)] ||
        a.label.localeCompare(b.label, 'es'),
    )
})

/** Equipos sueltos: los que no pertenecen a un salón o ciclo (o cuyo grupo no se pudo cargar). */
const individualTeams = computed(() => filtered.value.filter((team) => !groupedTeamIds.value.has(team.id)))
const visibleCount = computed(() => groupCards.value.length + individualTeams.value.length)

function resolveUrl(path: string) {
  if (path.startsWith('http')) return path
  return config.public.apiBase.replace(/\/api\/v1$/, '') + path
}

function rulesCheck(team: Team): { ok: boolean; messages: string[] } {
  const messages: string[] = []
  const discipline = team.discipline
  const count = countedPlayers(team)
  if (discipline) {
    if (count < discipline.minPlayers)
      messages.push(`Mínimo ${discipline.minPlayers} jugadores (tiene ${count}).`)
    if (count > discipline.maxPlayers)
      messages.push(`Máximo ${discipline.maxPlayers} jugadores (tiene ${count}).`)
    if (discipline.genderPolicy === 'MALE' && team.participants.some((p) => p.gender === 'F'))
      messages.push('La disciplina es solo varones.')
    if (discipline.genderPolicy === 'FEMALE' && team.participants.some((p) => p.gender === 'M'))
      messages.push('La disciplina es solo mujeres.')
    if (discipline.participantType === 'STUDENT' && team.participants.some((p) => !p.studentCode))
      messages.push('Todos los jugadores deben tener código de estudiante.')
    if (discipline.participantType === 'STUDENT' && (!team.cycle || !team.section))
      messages.push('El equipo debe tener ciclo y sección.')
    if (discipline.participantType === 'OTHER' && team.participants.some((p) => !p.dni))
      messages.push('Todos los jugadores deben tener DNI.')
  }
  return { ok: messages.length === 0, messages }
}

function countedPlayers(team: Team) {
  return countedParticipants(team.discipline?.participantType, team.participants)
}

function teamCycleSection(team: Team) {
  if (!team.cycle && !team.section) return '-'
  return `${team.cycle || 's/ciclo'} - ${team.section || 's/sección'}`
}

function teamPhoneLabel(team: Team) {
  return team.phone?.trim() || 'Sin teléfono'
}

/** De pago: la disciplina cobra por equipo o el equipo se paga con el comprobante de su grupo. */
function needsVoucher(team: Team) {
  return !!team.discipline?.isPaid || (team.groupId !== null && team.groupId !== undefined)
}

function voucherState(team: Team) {
  if (!team.voucher) return 'Sin voucher'
  if (team.voucher.status === 'VALIDATED') return 'Voucher validado'
  if (team.voucher.status === 'REJECTED') return 'Voucher rechazado'
  return 'Voucher pendiente'
}

/** En un salón o ciclo el primer equipo de cada disciplina va incluido en el pack; los demás son adicionales. */
function voucherBadge(team: Team) {
  const state = voucherState(team)
  if (team.groupId === null || team.groupId === undefined || !team.slot) return state
  return `${team.slot === 1 ? 'Incluido en el pack' : 'Adicional'} · ${state.toLowerCase()}`
}

async function loadTeams() {
  const query: Record<string, number | boolean | ParticipantType> = {}
  if (adv.eventId) query.eventId = adv.eventId
  if (adv.facultyId) query.facultyId = adv.facultyId
  if (adv.schoolId) query.schoolId = adv.schoolId
  if (adv.disciplineId) query.disciplineId = adv.disciplineId
  if (adv.participantType !== 'ALL') query.participantType = adv.participantType
  try {
    teams.value = await api.get<Team[]>('/registrations', query)
  } catch {
    teams.value = []
  }
  await loadGroups()
}

/** `GET /groups` exige el evento: se piden los de cada evento con cobro por salón o ciclo. */
async function loadGroups() {
  const eventIds = events.value
    .filter((event) => event.pricingMode === 'PER_GROUP' && (!adv.eventId || event.id === adv.eventId))
    .map((event) => event.id)
  const lists = await Promise.all(
    eventIds.map((eventId) => api.get<ClassGroup[]>('/groups', { eventId }).catch(() => [] as ClassGroup[])),
  )
  groups.value = lists.flat()
}

async function loadDisciplines() {
  const query: Record<string, number> = {}
  if (adv.eventId) query.eventId = adv.eventId
  if (adv.facultyId) query.facultyId = adv.facultyId
  if (adv.schoolId) query.schoolId = adv.schoolId
  try {
    disciplines.value = await api.get<Discipline[]>('/disciplines', query)
  } catch {
    disciplines.value = []
  }
}

async function loadUsers() {
  // La lista de usuarios solo la ve el equipo (sirve para elegir delegado al crear equipos).
  if (!auth.isAdmin) return
  try {
    users.value = await api.get<AuthUser[]>('/users')
  } catch {
    users.value = []
  }
}

async function load() {
  try {
    events.value = await api.get<SportEvent[]>('/events')
    await Promise.all([loadFaculties(), loadDisciplines(), loadTeams(), loadUsers()])
  } catch {
    teams.value = []
  }
}

/**
 * Un solo modal con dos paneles: el del equipo y el del pago de un salón o ciclo. Se cambia de panel
 * («Ver pago →» / «Ver equipo →»), nunca se apila otro modal. Los datos salen de las listas de la pantalla
 * (computed sobre `teams` y `groups`), así que tras editar, aprobar o validar la revisión muestra el estado
 * nuevo sin volver a abrirla.
 */
type Review =
  | { view: 'team'; teamId: number }
  | { view: 'payment'; groupId: number; voucherId: number }

/** Paneles abiertos (el último es el visible); cada uno es una entrada del historial del navegador. */
const reviewStack = ref<Review[]>([])
const review = computed<Review | null>(() => reviewStack.value[reviewStack.value.length - 1] ?? null)
const reviewOpen = computed({
  get: () => reviewStack.value.length > 0,
  set: (open: boolean) => {
    if (!open) closeReview()
  },
})
/** Texto del botón ← del modal: a qué panel vuelve (vacío si no hay panel anterior). */
const reviewBackLabel = computed(() => {
  const previous = reviewStack.value[reviewStack.value.length - 2]
  if (!previous) return ''
  return previous.view === 'payment' ? 'Volver al pago' : 'Volver al equipo'
})
const busy = ref(false)
const reviewError = ref('')
const notice = ref<{ kind: 'ok' | 'error'; text: string; details: string[] } | null>(null)

const reviewTeam = computed(() =>
  review.value?.view === 'team' ? (teamsById.value.get(review.value.teamId) ?? null) : null,
)

/** Salón o ciclo al que pertenece un equipo (si paga por grupo) y el comprobante que lo cubre. */
const reviewTeamGroup = computed(() => {
  const team = reviewTeam.value
  if (!team) return null
  return (
    groups.value.find((group) =>
      group.disciplines.some((discipline) => discipline.teams.some((t) => t.id === team.id)),
    ) ?? null
  )
})
const reviewTeamCoverage = computed(() =>
  reviewTeam.value && reviewTeamGroup.value ? coverageOf(reviewTeamGroup.value, reviewTeam.value.id) : null,
)

/** Comprobante del salón que se está revisando, con los equipos que cubre. */
const paymentContext = computed(() => {
  const current = review.value
  if (current?.view !== 'payment') return null
  const group = groups.value.find((item) => item.id === current.groupId)
  if (!group) return null
  const base = group.baseVoucher?.id === current.voucherId ? group.baseVoucher : null
  const extra = group.extraVouchers.find((item) => item.id === current.voucherId)
  const voucher = base ?? extra
  if (!voucher) return null
  const rows = groupTeamRows(group, teamsById.value).filter((row) =>
    base ? row.voucherId === base.id : !!extra && extra.teamIds.includes(row.id),
  )
  return { group, voucher, rows }
})

const reviewSize = computed<'2xl' | '4xl'>(() => {
  if (review.value?.view === 'payment') return '4xl'
  const team = reviewTeam.value
  // Un equipo que paga por disciplina trae su comprobante al lado; uno de un salón es solo el equipo.
  return team && !reviewTeamGroup.value && needsVoucher(team) ? '4xl' : '2xl'
})

const reviewTitle = computed(() => {
  if (review.value?.view === 'payment') {
    const context = paymentContext.value
    if (context?.voucher.kind === 'EXTRA') return 'Pago del equipo adicional'
    return `Pago general · ${context?.group.scope === 'CYCLE' ? 'Pack del ciclo' : 'Pack del salón'}`
  }
  const team = reviewTeam.value
  return team ? `${team.discipline?.name || team.disciplineName || 'Equipo'} · ${team.name}` : 'Revisar equipo'
})

// Si lo que se revisa deja de estar en las listas (p. ej. se recargaron con otros filtros), se cierra el modal.
watch([reviewTeam, paymentContext], () => {
  if (review.value && !reviewTeam.value && !paymentContext.value) closeReview()
})
watch(review, () => {
  reviewError.value = ''
})

/**
 * El modal vive en el historial del navegador (parámetro `revision` = cuántos paneles hay abiertos): «Atrás»,
 * el gesto de retroceso o el botón ← del modal vuelven al panel anterior y, desde el primero, cierran el modal;
 * nunca sacan al usuario de la pantalla. Cerrar con la X, el fondo o tras una acción retira todas las entradas.
 */
function pushReview(next: Review) {
  reviewStack.value = [...reviewStack.value, next]
  void router.push({ query: { ...route.query, revision: String(reviewStack.value.length) } })
}

function closeReview() {
  const depth = reviewStack.value.length
  if (!depth) return
  reviewStack.value = []
  router.go(-depth)
}

/** Un solo paso atrás: el cambio del parámetro `revision` descarta el panel visible (ver el watch de abajo). */
function backReview() {
  router.back()
}

watch(
  () => route.query.revision,
  (value) => {
    const depth = Number(value ?? 0)
    const wanted = Number.isInteger(depth) && depth > 0 ? depth : 0
    if (wanted < reviewStack.value.length) {
      reviewStack.value = reviewStack.value.slice(0, wanted)
    } else if (wanted > reviewStack.value.length && import.meta.client) {
      // Enlace recargado o «Adelante» sin panel que mostrar: se limpia el parámetro y no se abre nada.
      reviewStack.value = []
      const rest = Object.fromEntries(Object.entries(route.query).filter(([key]) => key !== 'revision'))
      void router.replace({ query: rest })
    }
  },
  { immediate: true },
)

function openReview(team: Team) {
  reviewStack.value = []
  pushReview({ view: 'team', teamId: team.id })
}

function openPayment(groupId: number, voucherId: number) {
  reviewStack.value = []
  pushReview({ view: 'payment', groupId, voucherId })
}

/** «Ver pago →» desde un equipo de un salón. */
function goToPayment() {
  const group = reviewTeamGroup.value
  const coverage = reviewTeamCoverage.value
  if (group && coverage) pushReview({ view: 'payment', groupId: group.id, voucherId: coverage.voucher.id })
}

/** «Ver equipo →» desde el pago. */
function viewTeamFromPayment(team: Team) {
  pushReview({ view: 'team', teamId: team.id })
}

/** Ejecuta una acción de la revisión: bloquea los botones y deja el error dentro del modal. */
async function run(action: () => Promise<void>, failure: string) {
  busy.value = true
  reviewError.value = ''
  try {
    await action()
  } catch (err) {
    reviewError.value = apiMessage(err, failure)
  } finally {
    busy.value = false
  }
}

/** Tras editar el equipo se recarga la lista y el panel muestra los datos nuevos (sigue abierto). */
async function onTeamEdited() {
  await loadTeams()
}

function finishAction(ok: string, details: string[] = []) {
  notice.value = { kind: 'ok', text: ok, details }
  reviewOpen.value = false
}

function approveReview() {
  const team = reviewTeam.value
  if (!team) return
  return run(async () => {
    await api.patch(`/registrations/${team.id}/approve`, {})
    finishAction(`Equipo «${team.name}» aprobado.`)
    await loadTeams()
  }, `No se pudo aprobar el equipo «${team.name}».`)
}

function rejectReview(reason: string) {
  const team = reviewTeam.value
  if (!team || !reason) return
  return run(async () => {
    await api.patch(`/registrations/${team.id}/reject`, { reason })
    finishAction(`Equipo «${team.name}» rechazado.`)
    await loadTeams()
  }, `No se pudo rechazar el equipo «${team.name}».`)
}

/** Voucher propio de un equipo que paga por disciplina. */
function validateTeamVoucher() {
  const team = reviewTeam.value
  if (!team?.voucher) return
  const voucherId = team.voucher.id
  return run(async () => {
    await api.patch(`/vouchers/${voucherId}/validate`, {})
    finishAction(`Voucher validado: equipo «${team.name}» aprobado.`)
    await loadTeams()
  }, 'No se pudo validar el voucher.')
}

/** Rechaza solo el comprobante (el delegado puede reemplazarlo); el equipo sigue pendiente. */
function rejectTeamVoucher(reason: string) {
  const team = reviewTeam.value
  if (!team?.voucher || !reason) return
  const voucherId = team.voucher.id
  return run(async () => {
    await api.patch(`/vouchers/${voucherId}/reject`, { reason })
    finishAction(`Comprobante del equipo «${team.name}» rechazado.`)
    await loadTeams()
  }, 'No se pudo rechazar el comprobante.')
}

/** Pago general o adicional de un salón: se valida una sola vez y aprueba los equipos que cumplen las bases. */
function validateGroupPayment() {
  const context = paymentContext.value
  if (!context) return
  return run(async () => {
    const result = await api.patch<GroupVoucherValidation>(`/vouchers/${context.voucher.id}/validate`, {})
    const names = new Map(
      context.group.disciplines.flatMap((d) => d.teams.map((t) => [t.id, t.name] as const)),
    )
    finishAction(
      `Pago validado. Equipos aprobados: ${result.approvedTeamIds.length}.`,
      result.skipped.map((item) => `${names.get(item.teamId) ?? `Equipo #${item.teamId}`}: ${item.reason}`),
    )
    await loadTeams()
  }, 'No se pudo validar el pago.')
}

function rejectGroupPayment(reason: string) {
  const context = paymentContext.value
  if (!context || !reason) return
  return run(async () => {
    await api.patch(`/vouchers/${context.voucher.id}/reject`, { reason })
    finishAction('Comprobante rechazado: el delegado podrá reenviarlo y los equipos aprobados con él vuelven a pendientes.')
    await loadTeams()
  }, 'No se pudo rechazar el comprobante.')
}

/** Desplegables de salones: todos contraídos al abrir la pantalla; se abre el que se va a revisar. */
const openGroupIds = ref<number[]>([])
const isGroupOpen = (id: number) => openGroupIds.value.includes(id)

function toggleGroup(id: number) {
  openGroupIds.value = isGroupOpen(id)
    ? openGroupIds.value.filter((openId) => openId !== id)
    : [...openGroupIds.value, id]
}

function expandAll() {
  openGroupIds.value = groupCards.value.map((group) => group.id)
}

function collapseAll() {
  openGroupIds.value = []
}

const createOpen = ref(false)
const submitting = ref(false)
const modalError = ref('')
const disciplines = ref<Discipline[]>([])
const participantSearch = ref('')
const participantError = ref('')
const searching = ref(false)

const createForm = reactive({
  disciplineId: 0,
  delegateId: 0,
  teamName: '',
  phone: '',
  cycle: '',
  section: '',
  operationNumber: '',
  participants: [] as Participant[],
  voucherFile: null as File | null,
})

const selectedDiscipline = computed(() =>
  disciplines.value.find((discipline) => discipline.id === createForm.disciplineId),
)

const participantMode = computed<'STUDENT' | 'OTHER'>(
  () => selectedDiscipline.value?.participantType ?? 'STUDENT',
)

const delegateOptions = computed(() =>
  users.value.filter((user) => {
    const isStudent = user.role === 'STUDENT' || Boolean(user.studentCode || /^\d+@/.test(user.email))
    const isOther = user.role === 'OTHER' || (!isStudent && user.role !== 'ADMIN_SYSTEM' && user.role !== 'OWNER_SYSTEM')
    return participantMode.value === 'STUDENT' ? isStudent || isOther : isOther
  }),
)

watch(
  () => createForm.disciplineId,
  () => {
    createForm.delegateId = 0
  },
)

const createCountedPlayers = computed(() =>
  countedParticipants(participantMode.value, createForm.participants),
)

function removeParticipant(index: number) {
  createForm.participants.splice(index, 1)
}

function onVoucher(event: Event) {
  const target = event.target as HTMLInputElement
  createForm.voucherFile = target.files?.[0] ?? null
}

async function openCreate() {
  modalError.value = ''
  participantError.value = ''
  Object.assign(createForm, {
    disciplineId: 0,
    delegateId: 0,
    teamName: '',
    phone: '',
    cycle: '',
    section: '',
    operationNumber: '',
    participants: [],
    voucherFile: null,
  })
  participantSearch.value = ''
  createOpen.value = true
  if (!disciplines.value.length) await loadDisciplines()
  if (!users.value.length) await loadUsers()
}

async function searchParticipant() {
  const q = participantSearch.value.trim()
  if (!q) return
  if (!createForm.disciplineId) {
    participantError.value = 'Primero selecciona una disciplina.'
    return
  }
  searching.value = true
  participantError.value = ''
  try {
    let person: AcademicStudent
    if (participantMode.value === 'OTHER') {
      if (!/^\d{8}$/.test(q)) {
        participantError.value = 'Ingresa un DNI válido de 8 dígitos.'
        return
      }
      person = await api.get<AcademicStudent>('/academic/dni', { numero: q })
    } else {
      person = await api.get<AcademicStudent>('/academic/student', { buscador: q })
    }
    const code = person.studentCode?.trim() || null
    const dni = person.dni?.trim() || (/^\d{8}$/.test(q) ? q : null)
    const already = createForm.participants.some(
      (participant) =>
        (code && participant.studentCode === code) ||
        (dni && participant.dni === dni) ||
        (participant.fullName.toLowerCase() === person.fullName.toLowerCase() &&
          (!code || !participant.studentCode) &&
          (!dni || !participant.dni)),
    )
    if (already) {
      participantError.value = 'Esa persona ya fue agregada.'
      return
    }
    createForm.participants.push({
      fullName: person.fullName.replace(/\s+/g, ' ').trim(),
      studentCode: code,
      dni,
      gender: 'O',
      isDelegate: false,
      countsAsPlayer: true,
    })
    participantSearch.value = ''
  } catch {
    participantError.value =
      participantMode.value === 'OTHER'
        ? 'No se encontró una persona con ese DNI.'
        : 'No se encontró un estudiante único con ese código.'
  } finally {
    searching.value = false
  }
}

async function submitCreate() {
  modalError.value = ''
  if (!createForm.disciplineId) {
    modalError.value = 'Selecciona una disciplina.'
    return
  }
  if (!createForm.delegateId) {
    modalError.value = 'Selecciona el delegado responsable.'
    return
  }
  if (!createForm.participants.length) {
    modalError.value = 'Agrega al menos un jugador.'
    return
  }
  if (
    participantMode.value === 'STUDENT' &&
    (!createForm.cycle.trim() || !createForm.section.trim())
  ) {
    modalError.value = 'Completa ciclo y sección del equipo.'
    return
  }
  if (
    selectedDiscipline.value &&
    (createCountedPlayers.value < selectedDiscipline.value.minPlayers ||
      createCountedPlayers.value > selectedDiscipline.value.maxPlayers)
  ) {
    modalError.value = `El equipo debe tener entre ${selectedDiscipline.value.minPlayers} y ${selectedDiscipline.value.maxPlayers} jugadores. Tiene ${createCountedPlayers.value}.`
    return
  }
  if (selectedDiscipline.value?.isPaid && !createForm.voucherFile) {
    modalError.value = 'Esta disciplina tiene costo: adjunta el comprobante de pago.'
    return
  }
  submitting.value = true
  try {
    const fd = new FormData()
    fd.append('disciplineId', String(createForm.disciplineId))
    fd.append('delegateId', String(createForm.delegateId))
    fd.append('teamName', createForm.teamName)
    fd.append('phone', createForm.phone)
    fd.append('cycle', createForm.cycle)
    fd.append('section', createForm.section)
    fd.append('participants', JSON.stringify(createForm.participants))
    if (selectedDiscipline.value?.isPaid) {
      fd.append('operationNumber', createForm.operationNumber)
      if (createForm.voucherFile) fd.append('voucher', createForm.voucherFile)
    }
    await api.upload('/registrations', fd)
    createOpen.value = false
    await loadTeams()
  } catch (err) {
    modalError.value =
      (err as { data?: { message?: string | string[] } })?.data?.message?.toString() ??
      'No se pudo crear el equipo.'
  } finally {
    submitting.value = false
  }
}

onMounted(load)
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
