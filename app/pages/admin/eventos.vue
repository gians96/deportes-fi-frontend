<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-white">Eventos</h1>
      <button
        class="rounded-lg bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300 hover:bg-green-500/20"
        @click="openCreate"
      >
        Nuevo evento
      </button>
    </div>

    <AppModal v-model="showForm" title="Nuevo evento" size="4xl">
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="create">
        <label class="block sm:col-span-2">
          <span class="text-sm text-oscuro-200">Nombre</span>
          <input v-model="form.name" required class="input" />
        </label>
        <div class="block sm:col-span-2">
          <span class="text-sm text-oscuro-200">Descripción</span>
          <RichTextEditor
            v-model="form.description"
            class="mt-1"
            min-height="240px"
            max-height="360px"
          />
        </div>
        <label class="block">
          <span class="text-sm text-oscuro-200">Facultad</span>
          <select v-model.number="form.facultyId" required class="input">
            <option :value="0" disabled>Selecciona una facultad</option>
            <option v-for="f in faculties" :key="f.id" :value="f.id">
              {{ f.name }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Escuela (opcional)</span>
          <select v-model.number="form.schoolId" class="input">
            <option :value="0">Todas las escuelas</option>
            <option v-for="s in schoolsOfFaculty" :key="s.id" :value="s.id">
              {{ s.name }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Inicio</span>
          <input v-model="form.startDate" type="date" required class="input" />
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Fin</span>
          <input v-model="form.endDate" type="date" required class="input" />
        </label>
        <p v-if="error" class="text-sm text-red-400 sm:col-span-2">{{ error }}</p>
        <button
          type="submit"
          class="rounded-lg bg-green-500 px-5 py-2.5 font-semibold text-oscuro-900 hover:bg-green-400 sm:col-span-2"
        >
          Guardar evento
        </button>
      </form>
    </AppModal>

    <div class="mt-6 space-y-3">
      <div
        v-for="event in events"
        :key="event.id"
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-oscuro-700 bg-oscuro-850 p-4"
      >
        <div>
          <p class="font-semibold text-white">{{ event.name }}</p>
          <p class="text-xs text-oscuro-400">
            {{ formatDateUtc(event.startDate) }} — {{ formatDateUtc(event.endDate) }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="
              event.isOpen
                ? 'bg-green-500/10 text-green-300'
                : 'bg-oscuro-700 text-oscuro-300'
            "
          >
            {{ event.isOpen ? 'Abierto' : 'Cerrado' }}
          </span>
          <button
            class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10"
            @click="openPricing(event)"
          >
            <Wallet class="h-3.5 w-3.5" />
            Cobro
          </button>
          <button
            class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/10"
            @click="openTokens(event)"
          >
            <KeyRound class="h-3.5 w-3.5" />
            Tokens API
          </button>
          <button
            class="rounded-lg px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/10"
            @click="openEdit(event)"
          >
            Editar
          </button>
          <button
            class="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10"
            @click="askDelete(event)"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- Cobro: por disciplina o por salón / ciclo -->
    <AppModal v-model="pricingOpen" :title="`Cobro · ${pricingEvent?.name ?? ''}`" size="2xl">
      <form class="space-y-4" @submit.prevent="savePricing">
        <div class="grid gap-2 sm:grid-cols-2">
          <button
            v-for="option in pricingModes"
            :key="option.value"
            type="button"
            class="rounded-xl border p-4 text-left transition"
            :class="
              pricingForm.pricingMode === option.value
                ? 'border-green-500/50 bg-green-500/10'
                : 'border-oscuro-700 bg-oscuro-900/60 hover:border-oscuro-500'
            "
            @click="pricingForm.pricingMode = option.value"
          >
            <p class="font-semibold text-white">{{ option.label }}</p>
            <p class="mt-1 text-xs text-oscuro-300">{{ option.hint }}</p>
          </button>
        </div>

        <div v-if="pricingForm.pricingMode === 'PER_GROUP'" class="grid gap-4 sm:grid-cols-2">
          <label v-for="field in pricingFields" :key="field.key" class="block">
            <span class="text-sm text-oscuro-200">{{ field.label }} (S/)</span>
            <input
              v-model.number="pricingForm[field.key]"
              type="number"
              min="0"
              step="0.01"
              required
              class="input"
            />
          </label>
          <p class="text-xs text-oscuro-400 sm:col-span-2">
            Deja las disciplinas de estudiantes como gratuitas: su costo va dentro del pago del
            salón o ciclo. Una vez inscritos salones o ciclos no se puede volver al cobro por
            disciplina; cambiar las tarifas no modifica los comprobantes ya enviados.
          </p>
        </div>

        <p v-if="pricingError" class="text-sm text-red-400">{{ pricingError }}</p>
        <p v-if="pricingSaved" class="text-sm text-green-400">Cobro guardado.</p>
        <button
          type="submit"
          class="rounded-lg bg-green-500 px-5 py-2.5 font-semibold text-oscuro-900 hover:bg-green-400 disabled:opacity-60"
          :disabled="pricingSaving"
        >
          {{ pricingSaving ? 'Guardando…' : 'Guardar cobro' }}
        </button>
      </form>
    </AppModal>

    <!-- Editar evento -->
    <AppModal v-model="editOpen" title="Editar evento" size="4xl">
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="saveEdit">
        <label class="block sm:col-span-2">
          <span class="text-sm text-oscuro-200">Nombre</span>
          <input v-model="editForm.name" required class="input" />
        </label>
        <div class="block sm:col-span-2">
          <span class="text-sm text-oscuro-200">Descripción</span>
          <RichTextEditor
            v-model="editForm.description"
            class="mt-1"
            min-height="240px"
            max-height="360px"
          />
        </div>
        <label class="block">
          <span class="text-sm text-oscuro-200">Facultad</span>
          <select v-model.number="editForm.facultyId" required class="input">
            <option :value="0" disabled>Selecciona una facultad</option>
            <option v-for="f in faculties" :key="f.id" :value="f.id">
              {{ f.name }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Escuela (opcional)</span>
          <select v-model.number="editForm.schoolId" class="input">
            <option :value="0">Todas las escuelas</option>
            <option v-for="s in editSchoolsOfFaculty" :key="s.id" :value="s.id">
              {{ s.name }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Inicio</span>
          <input v-model="editForm.startDate" type="date" required class="input" />
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Fin</span>
          <input v-model="editForm.endDate" type="date" required class="input" />
        </label>
        <label class="flex items-center gap-2 sm:col-span-2">
          <input v-model="editForm.isOpen" type="checkbox" class="h-4 w-4" />
          <span class="text-sm text-oscuro-200">Inscripciones abiertas</span>
        </label>
        <p v-if="modalError" class="text-sm text-red-400 sm:col-span-2">{{ modalError }}</p>
        <button
          type="submit"
          class="rounded-lg bg-green-500 px-5 py-2.5 font-semibold text-oscuro-900 hover:bg-green-400 sm:col-span-2"
        >
          Guardar cambios
        </button>
      </form>
    </AppModal>

    <!-- Confirmación de borrado -->
    <AppConfirm
      v-model="confirmOpen"
      title="Eliminar evento"
      :message="confirmMessage"
      :loading="confirmLoading"
      :error="modalError"
      @confirm="runDelete"
    />

    <!-- Tokens API del evento (integración con el congreso) -->
    <AppModal
      v-model="tokensOpen"
      :title="`Tokens API · ${tokensEvent?.name ?? ''}`"
      size="4xl"
    >
      <div class="space-y-5">
        <p class="text-sm text-oscuro-300">
          Los tokens permiten que el sistema del congreso consulte, de servidor a
          servidor, las inscripciones y pagos de <strong class="text-white">este
          evento</strong>. Configúralos solo en el servidor que los usa y revócalos si
          se filtran.
        </p>

        <!-- Token recién creado: se muestra una sola vez -->
        <div
          v-if="createdToken"
          class="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4"
        >
          <div class="flex items-start gap-3">
            <AlertTriangle class="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div class="min-w-0 flex-1">
              <p class="font-bold text-amber-300">
                Token "{{ createdToken.name }}" creado
              </p>
              <p class="mt-1 text-sm text-amber-100/90">
                Cópialo ahora, no se volverá a mostrar.
              </p>
              <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
                <input
                  ref="createdTokenInput"
                  :value="createdToken.token"
                  readonly
                  aria-label="Token de integración"
                  class="input font-mono text-sm"
                  @focus="selectCreatedToken"
                />
                <button
                  type="button"
                  class="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-oscuro-900 hover:bg-amber-300"
                  @click="copyToken"
                >
                  <Check v-if="copyState === 'copied'" class="h-4 w-4" />
                  <Copy v-else class="h-4 w-4" />
                  {{ copyState === 'copied' ? 'Copiado' : 'Copiar' }}
                </button>
              </div>
              <p v-if="copyState === 'manual'" class="mt-2 text-xs text-amber-200">
                No se pudo copiar automáticamente: el token está seleccionado, cópialo
                con Ctrl+C.
              </p>
              <button
                type="button"
                class="mt-3 text-sm font-semibold text-oscuro-200 hover:text-white"
                @click="dismissCreatedToken"
              >
                Ya lo guardé
              </button>
            </div>
          </div>
        </div>

        <!-- Crear token -->
        <form
          class="grid gap-3 rounded-xl border border-oscuro-700 bg-oscuro-900/40 p-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end"
          @submit.prevent="createToken"
        >
          <label class="block">
            <span class="text-sm text-oscuro-200">Nombre</span>
            <input
              v-model="tokenForm.name"
              required
              maxlength="100"
              placeholder="Ej. Congreso CIISIC 2026"
              class="input"
            />
          </label>
          <label class="block">
            <span class="text-sm text-oscuro-200">Vence (opcional)</span>
            <input
              v-model="tokenForm.expiresOn"
              type="date"
              :min="todayInput"
              class="input"
            />
          </label>
          <button
            type="submit"
            :disabled="tokenCreating"
            class="flex items-center justify-center gap-2 rounded-lg bg-green-500 px-5 py-2.5 font-semibold text-oscuro-900 hover:bg-green-400 disabled:opacity-60"
          >
            <KeyRound class="h-4 w-4" />
            {{ tokenCreating ? 'Creando…' : 'Crear token' }}
          </button>
          <p v-if="tokenFormError" class="text-sm text-red-400 sm:col-span-3">
            {{ tokenFormError }}
          </p>
        </form>

        <!-- Lista de tokens -->
        <div>
          <p v-if="tokensLoading" class="py-6 text-center text-sm text-oscuro-300">
            Cargando tokens…
          </p>
          <div
            v-else-if="tokensError"
            class="flex items-center justify-between gap-3 rounded-lg bg-red-500/10 p-3 text-sm text-red-300"
          >
            <span>{{ tokensError }}</span>
            <button
              type="button"
              class="font-semibold underline hover:text-red-200"
              @click="loadTokens"
            >
              Reintentar
            </button>
          </div>
          <p
            v-else-if="!tokens.length"
            class="rounded-lg border border-dashed border-oscuro-700 p-6 text-center text-sm text-oscuro-300"
          >
            Este evento aún no tiene tokens. Crea el primero con el formulario.
          </p>
          <div v-else class="overflow-x-auto rounded-xl border border-oscuro-700">
            <table class="w-full text-left text-sm">
              <thead class="bg-oscuro-800 text-oscuro-300">
                <tr>
                  <th class="px-4 py-3">Nombre</th>
                  <th class="px-4 py-3">Prefijo</th>
                  <th class="px-4 py-3">Creado</th>
                  <th class="px-4 py-3">Último uso</th>
                  <th class="px-4 py-3">Vence</th>
                  <th class="px-4 py-3">Estado</th>
                  <th class="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-oscuro-700 bg-oscuro-850">
                <tr v-for="token in tokens" :key="token.id">
                  <td class="px-4 py-3 font-semibold text-white">{{ token.name }}</td>
                  <td class="whitespace-nowrap px-4 py-3 font-mono text-xs text-oscuro-200">
                    {{ token.tokenPrefix }}…
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-oscuro-300">
                    {{ formatDateTime(token.createdAt) }}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-oscuro-300">
                    {{ token.lastUsedAt ? formatDateTime(token.lastUsedAt) : 'Nunca' }}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-oscuro-300">
                    {{ token.expiresAt ? formatDateTime(token.expiresAt) : 'Sin expiración' }}
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold"
                      :class="tokenStatusClass[token.status]"
                    >
                      {{ tokenStatusLabel[token.status] }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button
                      v-if="token.status !== 'REVOKED'"
                      class="text-sm font-semibold text-red-400 hover:text-red-300"
                      @click="askRevoke(token)"
                    >
                      Revocar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppModal>

    <!-- Confirmación de revocación (después del modal para quedar encima) -->
    <AppConfirm
      v-model="revokeOpen"
      title="Revocar token"
      :message="revokeMessage"
      confirm-text="Revocar"
      :loading="revokeLoading"
      :error="revokeError"
      @confirm="runRevoke"
    />
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle, Check, Copy, KeyRound, Wallet } from 'lucide-vue-next'
import type {
  CreatedEventApiToken,
  EventApiToken,
  EventApiTokenStatus,
  EventPricing,
  PricingMode,
  SportEvent,
} from '~/types/domain'
import { formatDateTime, formatDateUtc } from '~/utils/format'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const api = useApi()
const auth = useAuthStore()
const { faculties, load: loadFaculties } = useFaculties()
const events = ref<SportEvent[]>([])
const showForm = ref(false)
const error = ref('')
const form = reactive({
  name: '',
  description: '',
  facultyId: 0,
  schoolId: 0,
  startDate: '',
  endDate: '',
})

const schoolsOfFaculty = computed(
  () => faculties.value.find((f) => f.id === form.facultyId)?.schools ?? [],
)

watch(
  () => form.facultyId,
  () => {
    form.schoolId = 0
  },
)

const modalError = ref('')

function showModalError(err: unknown, fallback: string) {
  modalError.value =
    (err as { data?: { message?: string | string[] } })?.data?.message?.toString() ??
    fallback
}

function toDateInput(value: string) {
  return value ? value.slice(0, 10) : ''
}

// --- Editar evento ---
const editOpen = ref(false)
const editId = ref<number | null>(null)
const editForm = reactive({
  name: '',
  description: '',
  facultyId: 0,
  schoolId: 0,
  startDate: '',
  endDate: '',
  isOpen: true,
})

const editSchoolsOfFaculty = computed(
  () => faculties.value.find((f) => f.id === editForm.facultyId)?.schools ?? [],
)

function openEdit(event: SportEvent) {
  modalError.value = ''
  editId.value = event.id
  Object.assign(editForm, {
    name: event.name,
    description: event.description ?? '',
    facultyId: event.facultyId,
    schoolId: event.schoolId ?? 0,
    startDate: toDateInput(event.startDate),
    endDate: toDateInput(event.endDate),
    isOpen: event.isOpen,
  })
  editOpen.value = true
}

async function saveEdit() {
  modalError.value = ''
  if (!editForm.facultyId) {
    modalError.value = 'Selecciona una facultad'
    return
  }
  try {
    await api.patch(`/events/${editId.value}`, {
      name: editForm.name,
      description: editForm.description || undefined,
      facultyId: editForm.facultyId,
      schoolId: editForm.schoolId || null,
      startDate: editForm.startDate,
      endDate: editForm.endDate,
      isOpen: editForm.isOpen,
    })
    editOpen.value = false
    await load()
  } catch (err) {
    showModalError(err, 'No se pudo actualizar el evento')
  }
}

// --- Eliminar evento ---
const confirmOpen = ref(false)
const confirmLoading = ref(false)
const confirmMessage = ref('')
const deleteId = ref<number | null>(null)

function askDelete(event: SportEvent) {
  modalError.value = ''
  deleteId.value = event.id
  confirmMessage.value = `¿Eliminar el evento "${event.name}"? Esta acción no se puede deshacer.`
  confirmOpen.value = true
}

async function runDelete() {
  if (!deleteId.value) return
  confirmLoading.value = true
  modalError.value = ''
  try {
    await api.del(`/events/${deleteId.value}`)
    confirmOpen.value = false
    deleteId.value = null
    await load()
  } catch (err) {
    showModalError(err, 'No se pudo eliminar el evento')
  } finally {
    confirmLoading.value = false
  }
}

function resetForm() {
  Object.assign(form, {
    name: '',
    description: '',
    facultyId: auth.user?.facultyId ?? 0,
    schoolId: 0,
    startDate: '',
    endDate: '',
  })
}

function openCreate() {
  error.value = ''
  resetForm()
  showForm.value = true
}

async function load() {
  try {
    events.value = await api.get<SportEvent[]>('/events')
  } catch {
    events.value = []
  }
}

async function create() {
  error.value = ''
  if (!form.facultyId) {
    error.value = 'Selecciona una facultad'
    return
  }
  try {
    await api.post('/events', {
      name: form.name,
      description: form.description || undefined,
      facultyId: form.facultyId,
      schoolId: form.schoolId || undefined,
      startDate: form.startDate,
      endDate: form.endDate,
    })
    showForm.value = false
    resetForm()
    await load()
  } catch (err: unknown) {
    error.value =
      (err as { data?: { message?: string | string[] } })?.data?.message?.toString() ??
      'No se pudo crear el evento'
  }
}

// --- Tokens API del evento (integración con el congreso) ---
// El token en claro solo vive en `createdToken` mientras se muestra: nunca se
// guarda en cookies, storage ni stores, y se borra al descartarlo o cerrar.
const pricingOpen = ref(false)
const pricingEvent = ref<SportEvent | null>(null)
const pricingSaving = ref(false)
const pricingSaved = ref(false)
const pricingError = ref('')
const pricingForm = reactive({
  pricingMode: 'PER_DISCIPLINE' as PricingMode,
  sectionBase: 0,
  cycleBase: 0,
  sectionExtra: 0,
  cycleExtra: 0,
})
const pricingModes: { value: PricingMode; label: string; hint: string }[] = [
  {
    value: 'PER_DISCIPLINE',
    label: 'Por disciplina',
    hint: 'Cada equipo paga el costo de su disciplina (comportamiento de siempre).',
  },
  {
    value: 'PER_GROUP',
    label: 'Por salón o ciclo completo',
    hint: 'Un pago general cubre un equipo por disciplina; cada equipo adicional paga aparte.',
  },
]
const pricingFields: {
  key: 'sectionBase' | 'cycleBase' | 'sectionExtra' | 'cycleExtra'
  label: string
}[] = [
  { key: 'sectionBase', label: 'Pago general por salón' },
  { key: 'cycleBase', label: 'Pago general por ciclo completo' },
  { key: 'sectionExtra', label: 'Equipo adicional (salón)' },
  { key: 'cycleExtra', label: 'Equipo adicional (ciclo completo)' },
]

async function openPricing(event: SportEvent) {
  pricingEvent.value = event
  pricingError.value = ''
  pricingSaved.value = false
  pricingOpen.value = true
  try {
    Object.assign(pricingForm, await api.get<EventPricing>(`/events/${event.id}/pricing`))
  } catch (err) {
    pricingError.value = apiErrorMessage(err, 'No se pudo cargar el cobro del evento.')
  }
}

async function savePricing() {
  if (!pricingEvent.value) return
  pricingSaving.value = true
  pricingError.value = ''
  pricingSaved.value = false
  try {
    await api.put<EventPricing>(`/events/${pricingEvent.value.id}/pricing`, {
      pricingMode: pricingForm.pricingMode,
      sectionBase: Number(pricingForm.sectionBase) || 0,
      cycleBase: Number(pricingForm.cycleBase) || 0,
      sectionExtra: Number(pricingForm.sectionExtra) || 0,
      cycleExtra: Number(pricingForm.cycleExtra) || 0,
    })
    pricingSaved.value = true
    await load()
  } catch (err) {
    pricingError.value = apiErrorMessage(err, 'No se pudo guardar el cobro.')
  } finally {
    pricingSaving.value = false
  }
}

const tokensOpen = ref(false)
const tokensEvent = ref<SportEvent | null>(null)
const tokens = ref<EventApiToken[]>([])
const tokensLoading = ref(false)
const tokensError = ref('')
const tokenForm = reactive({ name: '', expiresOn: '' })
const tokenCreating = ref(false)
const tokenFormError = ref('')
const createdToken = ref<CreatedEventApiToken | null>(null)
const createdTokenInput = ref<HTMLInputElement | null>(null)
const copyState = ref<'idle' | 'copied' | 'manual'>('idle')

const tokenStatusLabel: Record<EventApiTokenStatus, string> = {
  ACTIVE: 'Activo',
  REVOKED: 'Revocado',
  EXPIRED: 'Expirado',
}
const tokenStatusClass: Record<EventApiTokenStatus, string> = {
  ACTIVE: 'bg-green-500/10 text-green-300',
  REVOKED: 'bg-red-500/10 text-red-300',
  EXPIRED: 'bg-oscuro-700 text-oscuro-300',
}

function apiErrorMessage(err: unknown, fallback: string) {
  const message = (err as { data?: { message?: string | string[] } })?.data?.message
  if (Array.isArray(message)) return message.join('. ')
  return message || fallback
}

function toLocalDateInput(date: Date) {
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const todayInput = computed(() => toLocalDateInput(new Date()))

/** Fin del día elegido en hora local, en ISO (lo que espera el backend). */
function endOfLocalDayIso(value: string) {
  const date = new Date(`${value}T23:59:59.999`)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function forgetCreatedToken() {
  createdToken.value = null
  copyState.value = 'idle'
}

function openTokens(event: SportEvent) {
  forgetCreatedToken()
  tokensEvent.value = event
  tokens.value = []
  tokensError.value = ''
  tokenFormError.value = ''
  Object.assign(tokenForm, { name: '', expiresOn: '' })
  tokensOpen.value = true
  void loadTokens()
}

async function loadTokens() {
  const eventId = tokensEvent.value?.id
  if (!eventId) return
  tokensLoading.value = true
  tokensError.value = ''
  try {
    const list = await api.get<EventApiToken[]>(`/events/${eventId}/api-tokens`)
    if (tokensEvent.value?.id === eventId) tokens.value = list
  } catch (err) {
    if (tokensEvent.value?.id === eventId) {
      tokensError.value = apiErrorMessage(err, 'No se pudieron cargar los tokens')
    }
  } finally {
    // Una respuesta tardía de otro evento no apaga la carga del evento actual.
    if (tokensEvent.value?.id === eventId) tokensLoading.value = false
  }
}

async function createToken() {
  const eventId = tokensEvent.value?.id
  if (!eventId || tokenCreating.value) return
  tokenFormError.value = ''
  const name = tokenForm.name.trim()
  if (!name) {
    tokenFormError.value = 'Escribe un nombre para el token'
    return
  }
  if (tokenForm.expiresOn && tokenForm.expiresOn < todayInput.value) {
    tokenFormError.value = 'La fecha de expiración no puede ser anterior a hoy'
    return
  }
  const expiresAt = tokenForm.expiresOn
    ? endOfLocalDayIso(tokenForm.expiresOn)
    : undefined
  // Una fecha ilegible nunca debe convertirse en un token sin expiración.
  if (tokenForm.expiresOn && !expiresAt) {
    tokenFormError.value = 'La fecha de expiración no es válida'
    return
  }
  tokenCreating.value = true
  try {
    const created = await api.post<CreatedEventApiToken>(
      `/events/${eventId}/api-tokens`,
      { name, expiresAt },
    )
    // Si el modal se cerró o cambió de evento, no se muestra fuera de contexto.
    if (!tokensOpen.value || tokensEvent.value?.id !== eventId) return
    createdToken.value = created
    copyState.value = 'idle'
    Object.assign(tokenForm, { name: '', expiresOn: '' })
    await loadTokens()
  } catch (err) {
    tokenFormError.value = apiErrorMessage(err, 'No se pudo crear el token')
  } finally {
    tokenCreating.value = false
  }
}

function selectCreatedToken() {
  createdTokenInput.value?.select()
}

async function copyToken() {
  if (!createdToken.value) return
  try {
    await navigator.clipboard.writeText(createdToken.value.token)
    copyState.value = 'copied'
  } catch {
    // Sin API de portapapeles (contexto no seguro o permiso denegado).
    selectCreatedToken()
    copyState.value = document.execCommand?.('copy') ? 'copied' : 'manual'
  }
}

function dismissCreatedToken() {
  forgetCreatedToken()
}

watch(tokensOpen, (open) => {
  if (!open) forgetCreatedToken()
})

// --- Revocar token ---
const revokeOpen = ref(false)
const revokeLoading = ref(false)
const revokeError = ref('')
const revokeTarget = ref<EventApiToken | null>(null)

const revokeMessage = computed(() =>
  revokeTarget.value
    ? `¿Revocar el token "${revokeTarget.value.name}" (${revokeTarget.value.tokenPrefix}…)? Las integraciones que lo usen dejarán de funcionar de inmediato. Esta acción no se puede deshacer.`
    : '',
)

function askRevoke(token: EventApiToken) {
  revokeTarget.value = token
  revokeError.value = ''
  revokeOpen.value = true
}

async function runRevoke() {
  const target = revokeTarget.value
  const eventId = tokensEvent.value?.id
  if (!target || !eventId) return
  revokeLoading.value = true
  revokeError.value = ''
  try {
    const updated = await api.del<EventApiToken>(
      `/events/${eventId}/api-tokens/${target.id}`,
    )
    tokens.value = tokens.value.map((token) =>
      token.id === updated.id ? updated : token,
    )
    revokeOpen.value = false
    revokeTarget.value = null
  } catch (err) {
    revokeError.value = apiErrorMessage(err, 'No se pudo revocar el token')
  } finally {
    revokeLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([load(), loadFaculties()])
  resetForm()
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
