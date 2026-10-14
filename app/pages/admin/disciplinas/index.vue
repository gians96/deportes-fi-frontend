<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-white">Disciplinas</h1>
      <button
        v-if="auth.isAdmin"
        class="rounded-lg bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300 hover:bg-green-500/20"
        @click="openCreate"
      >
        Nueva disciplina
      </button>
    </div>

    <AppModal v-model="showForm" title="Nueva disciplina" size="4xl">
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="create">
        <label class="block">
          <span class="text-sm text-oscuro-200">Evento</span>
          <select v-model.number="form.eventId" required class="input">
            <option :value="0" disabled>Selecciona…</option>
            <option v-for="e in events" :key="e.id" :value="e.id">
              {{ e.name }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Deporte</span>
          <div class="mt-1 flex items-center gap-2">
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              :class="getSportMeta(form.name).bg"
            >
              <component
                :is="getSportMeta(form.name).icon"
                class="h-5 w-5"
                :class="getSportMeta(form.name).color"
              />
            </span>
            <select v-model="form.name" required class="input !mt-0">
              <option value="" disabled>Selecciona…</option>
              <option v-for="s in SPORTS" :key="s.label" :value="s.label">
                {{ s.label }}
              </option>
            </select>
          </div>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Modalidad</span>
          <select v-model="form.modality" class="input">
            <option value="TEAM">Por equipos</option>
            <option value="INDIVIDUAL">Individual</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Política de género</span>
          <select v-model="form.genderPolicy" class="input">
            <option value="MALE">Masculino</option>
            <option value="FEMALE">Femenino</option>
            <option value="MIXED">Mixto</option>
            <option value="FREE">Libre</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Formato</span>
          <select v-model="form.format" class="input">
            <option value="ELIMINATION">Eliminación</option>
            <option value="POINTS">Puntos</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Tipo de participante</span>
          <select v-model="form.participantType" class="input">
            <option value="STUDENT">Solo estudiantes</option>
            <option value="OTHER">Otros (por DNI)</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Cierre de inscripción</span>
          <input
            v-model="form.registrationDeadline"
            type="datetime-local"
            required
            class="input"
          />
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Mín. jugadores</span>
          <input v-model.number="form.minPlayers" type="number" min="1" class="input" />
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Máx. jugadores</span>
          <input v-model.number="form.maxPlayers" type="number" min="1" class="input" />
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Máx. equipos</span>
          <input v-model.number="form.maxTeams" type="number" min="0" class="input" />
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Duración por partido (min)</span>
          <input v-model.number="form.matchDurationMinutes" type="number" min="1" class="input" />
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Lozas / canchas</span>
          <input v-model.number="form.courtsCount" type="number" min="1" class="input" />
        </label>
        <label class="flex items-center gap-2 pt-6">
          <input v-model="form.isPaid" type="checkbox" class="h-4 w-4" />
          <span class="text-sm text-oscuro-200">Inscripción con costo</span>
        </label>
        <label v-if="form.isPaid" class="block">
          <span class="text-sm text-oscuro-200">Costo (S/)</span>
          <input v-model.number="form.cost" type="number" min="0" step="0.5" class="input" />
        </label>
        <div v-if="form.format === 'POINTS'" class="grid gap-3 sm:col-span-2 sm:grid-cols-4">
          <label class="block">
            <span class="text-sm text-oscuro-200">Pts. victoria</span>
            <input v-model.number="form.winPoints" type="number" min="0" class="input" />
          </label>
          <label class="block">
            <span class="text-sm text-oscuro-200">Pts. empate</span>
            <input v-model.number="form.drawPoints" type="number" min="0" class="input" />
          </label>
          <label class="block">
            <span class="text-sm text-oscuro-200">Pts. derrota</span>
            <input v-model.number="form.lossPoints" type="number" min="0" class="input" />
          </label>
          <label class="flex items-center gap-2 pt-6">
            <input v-model="form.allowDraw" type="checkbox" class="h-4 w-4" />
            <span class="text-sm text-oscuro-200">Permite empate</span>
          </label>
        </div>
        <div class="block sm:col-span-2">
          <span class="text-sm text-oscuro-200">Bases / reglamento</span>
          <RichTextEditor
            v-model="form.rulesText"
            class="mt-1"
            min-height="320px"
            max-height="460px"
          />
        </div>
        <p v-if="modalError" class="text-sm text-red-400 sm:col-span-2">{{ modalError }}</p>
        <button
          type="submit"
          class="rounded-lg bg-green-500 px-5 py-2.5 font-semibold text-oscuro-900 hover:bg-green-400 disabled:opacity-60 sm:col-span-2"
          :disabled="saving"
        >
          {{ saving ? 'Guardando…' : 'Guardar disciplina' }}
        </button>
      </form>
    </AppModal>

    <!-- Filtros -->
    <div class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <label class="block">
        <span class="text-xs text-oscuro-400">Evento</span>
        <select v-model.number="filters.eventId" class="input">
          <option :value="0">Todos</option>
          <option v-for="e in events" :key="e.id" :value="e.id">
            {{ e.name }}
          </option>
        </select>
      </label>
      <label class="block">
        <span class="text-xs text-oscuro-400">Facultad</span>
        <select v-model.number="filters.facultyId" class="input">
          <option :value="0">Todas</option>
          <option v-for="f in faculties" :key="f.id" :value="f.id">
            {{ f.name }}
          </option>
        </select>
      </label>
      <label class="block">
        <span class="text-xs text-oscuro-400">Escuela profesional</span>
        <select v-model.number="filters.schoolId" class="input">
          <option :value="0">Todas</option>
          <option v-for="s in filterSchools" :key="s.id" :value="s.id">
            {{ s.name }}
          </option>
        </select>
      </label>
      <label class="block">
        <span class="text-xs text-oscuro-400">Cierre</span>
        <select v-model="filters.deadline" class="input">
          <option value="ALL">Todas</option>
          <option value="OPEN">Inscripcion abierta</option>
          <option value="CLOSED">Inscripcion cerrada</option>
        </select>
      </label>
    </div>

    <div class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="d in filteredDisciplines"
        :key="d.id"
        class="rounded-xl border border-oscuro-700 bg-oscuro-850 p-3 transition-all hover:border-green-700/40 hover:shadow-lg hover:shadow-green-900/10"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-start gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              :class="getSportMeta(d.name).bg"
            >
              <component
                :is="getSportMeta(d.name).icon"
                class="h-5 w-5"
                :class="getSportMeta(d.name).color"
              />
            </span>
            <div class="min-w-0">
              <div class="flex min-w-0 flex-wrap items-center gap-2">
                <p class="truncate font-semibold text-white">{{ d.name }}</p>
                <span
                  class="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                  :class="
                    d.participantType === 'OTHER'
                      ? 'bg-amber-500/10 text-amber-300'
                      : 'bg-sky-500/10 text-sky-300'
                  "
                >
                  {{ d.participantType === 'OTHER' ? 'Otros' : 'Estudiantes' }}
                </span>
              </div>
              <p class="mt-1 text-xs text-oscuro-400">
                {{ d.modality === 'TEAM' ? 'Equipos' : 'Individual' }} ·
                {{ d.minPlayers }}-{{ d.maxPlayers }} jug. ·
                Aprobados: {{ registeredTeamsLabel(d) }} equipos ·
                {{ d.isPaid ? formatCurrency(d.cost) : 'Gratuito' }}
              </p>
              <p class="mt-1 text-xs text-oscuro-500">
                Cierre: {{ formatDateTime(d.registrationDeadline) }} ·
                {{ d.format === 'POINTS' ? 'Puntos' : 'Eliminacion' }}
              </p>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <NuxtLink
              :to="`/admin/disciplinas/${d.id}/fixture`"
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-green-300 transition hover:bg-green-500/10"
              title="Fixture / Resultados"
              aria-label="Fixture / Resultados"
            >
              <Trophy class="h-4 w-4" />
            </NuxtLink>
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-amber-300 transition hover:bg-amber-500/10"
              title="Imprimir fixture"
              aria-label="Imprimir fixture"
              @click="openPrint(d)"
            >
              <Printer class="h-4 w-4" />
            </button>
            <button
              v-if="auth.isAdmin"
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-sky-300 transition hover:bg-sky-500/10"
              title="Editar disciplina"
              aria-label="Editar disciplina"
              @click="openEdit(d)"
            >
              <Pencil class="h-4 w-4" />
            </button>
            <button
              v-if="auth.isAdmin"
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-500/10"
              title="Eliminar disciplina"
              aria-label="Eliminar disciplina"
              @click="askDelete(d)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Editar disciplina -->
    <AppModal v-model="editOpen" title="Editar disciplina" size="4xl">
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="saveEdit">
        <label class="block">
          <span class="text-sm text-oscuro-200">Evento</span>
          <select v-model.number="editForm.eventId" required class="input">
            <option :value="0" disabled>Selecciona…</option>
            <option v-for="e in events" :key="e.id" :value="e.id">{{ e.name }}</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Deporte</span>
          <div class="mt-1 flex items-center gap-2">
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              :class="getSportMeta(editForm.name).bg"
            >
              <component
                :is="getSportMeta(editForm.name).icon"
                class="h-5 w-5"
                :class="getSportMeta(editForm.name).color"
              />
            </span>
            <select v-model="editForm.name" required class="input !mt-0">
              <option value="" disabled>Selecciona…</option>
              <option v-for="s in SPORTS" :key="s.label" :value="s.label">
                {{ s.label }}
              </option>
            </select>
          </div>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Modalidad</span>
          <select v-model="editForm.modality" class="input">
            <option value="TEAM">Por equipos</option>
            <option value="INDIVIDUAL">Individual</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Política de género</span>
          <select v-model="editForm.genderPolicy" class="input">
            <option value="MALE">Masculino</option>
            <option value="FEMALE">Femenino</option>
            <option value="MIXED">Mixto</option>
            <option value="FREE">Libre</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Formato</span>
          <select v-model="editForm.format" class="input">
            <option value="ELIMINATION">Eliminación</option>
            <option value="POINTS">Puntos</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Tipo de participante</span>
          <select v-model="editForm.participantType" class="input">
            <option value="STUDENT">Solo estudiantes</option>
            <option value="OTHER">Otros (por DNI)</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Cierre de inscripción</span>
          <input v-model="editForm.registrationDeadline" type="datetime-local" required class="input" />
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Mín. jugadores</span>
          <input v-model.number="editForm.minPlayers" type="number" min="1" class="input" />
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Máx. jugadores</span>
          <input v-model.number="editForm.maxPlayers" type="number" min="1" class="input" />
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Máx. equipos</span>
          <input v-model.number="editForm.maxTeams" type="number" min="0" class="input" />
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Duración por partido (min)</span>
          <input v-model.number="editForm.matchDurationMinutes" type="number" min="1" class="input" />
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Lozas / canchas</span>
          <input v-model.number="editForm.courtsCount" type="number" min="1" class="input" />
        </label>
        <label class="flex items-center gap-2 pt-6">
          <input v-model="editForm.isPaid" type="checkbox" class="h-4 w-4" />
          <span class="text-sm text-oscuro-200">Inscripción con costo</span>
        </label>
        <label v-if="editForm.isPaid" class="block">
          <span class="text-sm text-oscuro-200">Costo (S/)</span>
          <input v-model.number="editForm.cost" type="number" min="0" step="0.5" class="input" />
        </label>
        <div v-if="editForm.format === 'POINTS'" class="grid gap-3 sm:col-span-2 sm:grid-cols-4">
          <label class="block">
            <span class="text-sm text-oscuro-200">Pts. victoria</span>
            <input v-model.number="editForm.winPoints" type="number" min="0" class="input" />
          </label>
          <label class="block">
            <span class="text-sm text-oscuro-200">Pts. empate</span>
            <input v-model.number="editForm.drawPoints" type="number" min="0" class="input" />
          </label>
          <label class="block">
            <span class="text-sm text-oscuro-200">Pts. derrota</span>
            <input v-model.number="editForm.lossPoints" type="number" min="0" class="input" />
          </label>
          <label class="flex items-center gap-2 pt-6">
            <input v-model="editForm.allowDraw" type="checkbox" class="h-4 w-4" />
            <span class="text-sm text-oscuro-200">Permite empate</span>
          </label>
        </div>
        <div class="block sm:col-span-2">
          <span class="text-sm text-oscuro-200">Bases / reglamento</span>
          <RichTextEditor
            v-model="editForm.rulesText"
            class="mt-1"
            min-height="320px"
            max-height="460px"
          />
        </div>
        <p v-if="modalError" class="text-sm text-red-400 sm:col-span-2">{{ modalError }}</p>
        <button
          type="submit"
          class="rounded-lg bg-green-500 px-5 py-2.5 font-semibold text-oscuro-900 hover:bg-green-400 disabled:opacity-60 sm:col-span-2"
          :disabled="saving"
        >
          {{ saving ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </form>
    </AppModal>

    <!-- Confirmación de borrado -->
    <AppConfirm
      v-model="confirmOpen"
      title="Eliminar disciplina"
      :message="confirmMessage"
      :loading="confirmLoading"
      :error="modalError"
      @confirm="runDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { Pencil, Printer, Trash2, Trophy } from 'lucide-vue-next'
import type { Discipline, SportEvent } from '~/types/domain'
import {
  formatCurrency,
  formatDateTime,
  fromDateTimeLocalInput,
  isDeadlinePassed,
  toDateTimeLocalInput,
} from '~/utils/format'
import { RICH_TEXT_MAX_BYTES, richTextBytes } from '~/utils/richText'
import { SPORTS, getSportMeta } from '~/utils/sports'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const api = useApi()
const auth = useAuthStore()
const events = ref<SportEvent[]>([])
const disciplines = ref<Discipline[]>([])
const showForm = ref(false)
const { faculties, load: loadFaculties } = useFaculties()

const filters = reactive({
  eventId: 0,
  facultyId: 0,
  schoolId: 0,
  deadline: 'ALL' as 'ALL' | 'OPEN' | 'CLOSED',
})

const filteredDisciplines = computed(() =>
  disciplines.value.filter((discipline) => {
    if (filters.deadline === 'ALL') return true
    const closed = isDeadlinePassed(discipline.registrationDeadline)
    return filters.deadline === 'CLOSED' ? closed : !closed
  }),
)

const filterSchools = computed(
  () => faculties.value.find((f) => f.id === filters.facultyId)?.schools ?? [],
)

watch(
  () => filters.facultyId,
  () => {
    filters.schoolId = 0
  },
)

watch(
  () => [filters.eventId, filters.facultyId, filters.schoolId],
  () => loadDisciplines(),
)

const form = reactive({
  eventId: 0,
  name: '',
  modality: 'TEAM' as Discipline['modality'],
  genderPolicy: 'FREE' as Discipline['genderPolicy'],
  format: 'ELIMINATION' as Discipline['format'],
  participantType: 'STUDENT' as Discipline['participantType'],
  registrationDeadline: '',
  minPlayers: 1,
  maxPlayers: 1,
  maxTeams: 0,
  isPaid: false,
  cost: 0,
  rulesText: '',
  winPoints: 3,
  drawPoints: 1,
  lossPoints: 0,
  allowDraw: true,
  matchDurationMinutes: 30,
  courtsCount: 1,
})

async function load() {
  try {
    events.value = await api.get<SportEvent[]>('/events')
    await Promise.all([loadFaculties(), loadDisciplines()])
  } catch {
    /* noop */
  }
}

async function loadDisciplines() {
  const query: Record<string, number> = {}
  if (filters.eventId) query.eventId = filters.eventId
  if (filters.facultyId) query.facultyId = filters.facultyId
  if (filters.schoolId) query.schoolId = filters.schoolId
  try {
    disciplines.value = await api.get<Discipline[]>('/disciplines', query)
  } catch {
    disciplines.value = []
  }
}

const saving = ref(false)

/** Mensaje si las bases no caben en la columna del servidor; `null` si el tamaño es válido. */
function rulesTooLong(rulesText: string): string | null {
  const bytes = richTextBytes(rulesText)
  if (bytes <= RICH_TEXT_MAX_BYTES) return null
  return `Las bases ocupan ${(bytes / 1000).toFixed(1)} KB y el máximo es ${(RICH_TEXT_MAX_BYTES / 1000).toFixed(1)} KB. Acórtalas e inténtalo de nuevo.`
}

async function create() {
  modalError.value = rulesTooLong(form.rulesText) ?? ''
  if (modalError.value) return
  saving.value = true
  try {
    await api.post('/disciplines', disciplinePayload(form))
    showForm.value = false
    await load()
  } catch (err) {
    showModalError(err, 'No se pudo guardar la disciplina')
  } finally {
    saving.value = false
  }
}

function resetForm() {
  Object.assign(form, {
    eventId: 0,
    name: '',
    modality: 'TEAM',
    genderPolicy: 'FREE',
    format: 'ELIMINATION',
    participantType: 'STUDENT',
    registrationDeadline: '',
    minPlayers: 1,
    maxPlayers: 1,
    maxTeams: 0,
    isPaid: false,
    cost: 0,
    rulesText: '',
    winPoints: 3,
    drawPoints: 1,
    lossPoints: 0,
    allowDraw: true,
    matchDurationMinutes: 30,
    courtsCount: 1,
  })
}

function openCreate() {
  resetForm()
  modalError.value = ''
  showForm.value = true
}

const modalError = ref('')

/** Muestra el mensaje del servidor; ante un 500 (o sin mensaje) explica que el problema no es del usuario. */
function showModalError(err: unknown, fallback: string) {
  const e = err as {
    statusCode?: number
    status?: number
    data?: { statusCode?: number; message?: string | string[] }
  }
  const status = e?.statusCode ?? e?.status ?? e?.data?.statusCode ?? 0
  const message = e?.data?.message?.toString()
  modalError.value =
    status >= 500 || !message
      ? `${fallback}. El servidor tuvo un problema: inténtalo de nuevo y, si se repite, avisa al administrador del sistema.`
      : message
}

function disciplinePayload<T extends { registrationDeadline: string }>(source: T) {
  return {
    ...source,
    registrationDeadline: fromDateTimeLocalInput(source.registrationDeadline),
  }
}

function registeredTeamsLabel(discipline: Discipline) {
  const count = discipline.teamsCount ?? 0
  return discipline.maxTeams > 0 ? `${count}/${discipline.maxTeams}` : String(count)
}

function openPrint(discipline: Discipline) {
  const view = discipline.format === 'POINTS' ? 'rounds' : 'bracket'
  window.open(`/admin/disciplinas/${discipline.id}/fixture-print?view=${view}`, '_blank')
}

// --- Editar disciplina ---
const editOpen = ref(false)
const editId = ref<number | null>(null)
const editForm = reactive({
  eventId: 0,
  name: '',
  modality: 'TEAM' as Discipline['modality'],
  genderPolicy: 'FREE' as Discipline['genderPolicy'],
  format: 'ELIMINATION' as Discipline['format'],
  participantType: 'STUDENT' as Discipline['participantType'],
  registrationDeadline: '',
  minPlayers: 1,
  maxPlayers: 1,
  maxTeams: 0,
  isPaid: false,
  cost: 0,
  rulesText: '',
  winPoints: 3,
  drawPoints: 1,
  lossPoints: 0,
  allowDraw: true,
  matchDurationMinutes: 30,
  courtsCount: 1,
})

function openEdit(d: Discipline) {
  modalError.value = ''
  editId.value = d.id
  Object.assign(editForm, {
    eventId: d.eventId,
    name: d.name,
    modality: d.modality,
    genderPolicy: d.genderPolicy,
    format: d.format,
    participantType: d.participantType,
    registrationDeadline: toDateTimeLocalInput(d.registrationDeadline),
    minPlayers: d.minPlayers,
    maxPlayers: d.maxPlayers,
    maxTeams: d.maxTeams,
    isPaid: d.isPaid,
    cost: d.cost,
    rulesText: d.rulesText ?? '',
    winPoints: d.winPoints ?? 3,
    drawPoints: d.drawPoints ?? 1,
    lossPoints: d.lossPoints ?? 0,
    allowDraw: d.allowDraw ?? true,
    matchDurationMinutes: d.matchDurationMinutes ?? 30,
    courtsCount: d.courtsCount ?? 1,
  })
  editOpen.value = true
}

async function saveEdit() {
  modalError.value = rulesTooLong(editForm.rulesText) ?? ''
  if (modalError.value) return
  saving.value = true
  try {
    await api.patch(`/disciplines/${editId.value}`, disciplinePayload(editForm))
    editOpen.value = false
    await load()
  } catch (err) {
    showModalError(err, 'No se pudo actualizar la disciplina')
  } finally {
    saving.value = false
  }
}

// --- Eliminar disciplina ---
const confirmOpen = ref(false)
const confirmLoading = ref(false)
const confirmMessage = ref('')
const deleteId = ref<number | null>(null)

function askDelete(d: Discipline) {
  modalError.value = ''
  deleteId.value = d.id
  confirmMessage.value = `¿Eliminar la disciplina "${d.name}"? Esta acción no se puede deshacer.`
  confirmOpen.value = true
}

async function runDelete() {
  if (!deleteId.value) return
  confirmLoading.value = true
  modalError.value = ''
  try {
    await api.del(`/disciplines/${deleteId.value}`)
    confirmOpen.value = false
    deleteId.value = null
    await load()
  } catch (err) {
    showModalError(err, 'No se pudo eliminar la disciplina')
  } finally {
    confirmLoading.value = false
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
