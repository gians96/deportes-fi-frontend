<template>
  <div class="mx-auto max-w-5xl">
    <button
      type="button"
      class="inline-flex items-center gap-1 text-sm text-oscuro-300 hover:text-white"
      @click="goBack"
    >
      <ChevronLeft class="h-4 w-4" /> {{ backLabel }}
    </button>

    <h1 class="mt-4 text-2xl font-bold text-white">
      {{ editing ? 'Editar equipo' : 'Inscripción de equipo' }}
    </h1>
    <p class="mt-1 text-oscuro-300">
      Completa los datos del equipo y registra a los jugadores.
    </p>

    <div
      v-if="discipline"
      class="mt-4 rounded-2xl border border-oscuro-700 bg-oscuro-850 p-4 text-sm text-oscuro-200"
    >
      <p>
        {{ participantTypeLabel(discipline.participantType) }} · jugadores para
        bases: {{ countedPlayers }} / {{ discipline.minPlayers }}-{{ discipline.maxPlayers }}
      </p>
      <p v-if="!group" class="mt-1 text-xs text-oscuro-400">
        Tú serás el delegado responsable. La lista de integrantes cuenta solo a los jugadores del equipo.
      </p>
      <template v-else>
        <p class="mt-2 text-white">
          <span class="font-semibold">{{ discipline.name }}</span> · {{ scopeLabel(group.scope) }}
          <span class="font-semibold text-green-300">{{ group.label }}</span>
        </p>
        <p class="mt-1 text-xs text-oscuro-400">
          {{
            isExtra
              ? `Este será un equipo adicional en ${discipline.name}: requiere su propio comprobante (${formatCurrency(extraAmount)}).`
              : 'Este equipo está incluido en el pago general de tu salón o ciclo: no necesitas otro comprobante.'
          }}
        </p>
      </template>
    </div>

    <p
      v-if="group && editing && !blocked"
      class="mt-3 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-200"
    >
      Este equipo está en borrador: todavía no lo ve el tesorero. Puedes seguir editándolo y, cuando esté
      completo, pulsa «Enviar inscripción».
    </p>
    <p v-else-if="group && !blocked" class="mt-3 text-xs text-oscuro-400">
      Si te falta información puedes guardar un borrador y terminar después desde «Mi salón o ciclo».
    </p>

    <p v-if="discipline && !canRegister" class="mt-3 text-sm text-amber-300">
      Esta disciplina no corresponde a tu tipo de participante.
    </p>

    <form class="mt-6 space-y-6" @submit.prevent="submit()">
      <fieldset class="rounded-2xl border border-oscuro-700 bg-oscuro-850 p-5 shadow-xl shadow-black/10">
        <legend class="px-2 text-sm font-semibold text-green-300">
          Datos del equipo
        </legend>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm text-oscuro-200">Nombre del equipo</span>
            <input
              v-model="form.teamName"
              type="text"
              required
              class="input"
              placeholder="Ej. Los Ingenieros FC"
            />
          </label>
          <label class="block">
            <span class="text-sm text-oscuro-200">Celular de contacto</span>
            <input
              v-model="form.phone"
              type="tel"
              class="input"
              placeholder="999 999 999"
            />
          </label>
          <label v-if="participantMode === 'STUDENT' && !group && !resolving" class="block">
            <span class="text-sm text-oscuro-200">Ciclo</span>
            <input
              v-model="form.cycle"
              type="text"
              required
              class="input"
              placeholder="Ej. VIII"
            />
          </label>
          <label v-if="participantMode === 'STUDENT' && !group && !resolving" class="block">
            <span class="text-sm text-oscuro-200">Sección</span>
            <input
              v-model="form.section"
              type="text"
              required
              class="input"
              placeholder="Ej. A"
            />
          </label>
        </div>
      </fieldset>

      <fieldset class="rounded-2xl border border-oscuro-700 bg-oscuro-850 p-5 shadow-xl shadow-black/10">
        <legend class="px-2 text-sm font-semibold text-green-300">
          Delegado responsable
        </legend>
        <div class="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3">
          <p class="font-semibold text-white">{{ auth.user?.fullName }}</p>
          <p class="mt-1 text-xs text-oscuro-400">
            {{ auth.user?.email }}<span v-if="auth.user?.studentCode"> · {{ auth.user.studentCode }}</span>
          </p>
        </div>
      </fieldset>

      <fieldset class="rounded-2xl border border-oscuro-700 bg-oscuro-850 p-5 shadow-xl shadow-black/10">
        <legend class="px-2 text-sm font-semibold text-green-300">
          Jugadores
        </legend>

        <div class="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label>
            <span class="text-sm text-oscuro-200">
              {{ participantMode === 'OTHER' ? 'Buscar por DNI' : 'Buscar por código de estudiante' }}
            </span>
            <input
              v-model="search"
              type="text"
              :inputmode="participantMode === 'OTHER' ? 'numeric' : 'text'"
              class="input"
              :placeholder="participantMode === 'OTHER' ? 'Ej. 71234567' : 'Ej. 2301010149'"
              @keydown.enter.prevent="searchStudent"
            />
          </label>
          <button
            type="button"
            class="h-[46px] rounded-lg bg-green-500/15 px-5 font-semibold text-green-300 transition hover:bg-green-500/25 disabled:opacity-60"
            :disabled="roster.searching.value"
            @click="searchStudent"
          >
            {{ roster.searching.value ? 'Buscando...' : 'Buscar' }}
          </button>
        </div>
        <p v-if="roster.searchError.value" class="mt-2 text-sm text-red-400">
          {{ roster.searchError.value }}
        </p>

        <ul class="mt-5 space-y-3">
          <li
            v-for="(p, i) in form.participants"
            :key="p.studentCode || p.dni || p.fullName"
            class="grid gap-3 rounded-xl border border-oscuro-800 bg-oscuro-900/60 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center"
          >
            <div>
              <p class="text-lg font-bold uppercase tracking-normal text-white">
                {{ p.fullName }}
              </p>
              <p class="mt-1 text-xs text-oscuro-400">
                {{ p.studentCode || p.dni }} · {{ p.isCaptain ? 'Capitán/a' : 'Jugador' }}
              </p>
              <div v-if="group" class="mt-3 flex flex-wrap items-center gap-4">
                <label class="flex items-center gap-2 text-xs text-oscuro-300">
                  DNI
                  <input
                    v-model="p.dni"
                    type="text"
                    inputmode="numeric"
                    maxlength="8"
                    class="input !mt-0 w-32 !py-1.5 text-sm"
                    placeholder="8 dígitos"
                  />
                </label>
                <span
                  v-if="fromRegistry(p) && p.dni"
                  class="rounded-md bg-green-500/10 px-2 py-0.5 text-[0.7rem] font-semibold text-green-300"
                >
                  Del padrón
                </span>
                <span v-else-if="!p.dni" class="text-xs text-amber-300">
                  No figura en el padrón: escríbelo.
                </span>
                <label class="flex items-center gap-1.5 text-xs text-oscuro-200">
                  <input
                    type="radio"
                    name="captain"
                    :checked="p.isCaptain === true"
                    @change="setCaptain(i)"
                  />
                  Capitán/a
                </label>
              </div>
            </div>
            <button
              type="button"
              class="text-xs text-red-400 hover:text-red-300 md:justify-self-end"
              @click="removeParticipant(i)"
            >
              Quitar
            </button>
          </li>
        </ul>
        <p v-if="!form.participants.length" class="mt-3 text-sm text-oscuro-400">
          Agrega al menos un jugador.
        </p>
      </fieldset>

      <fieldset
        v-if="discipline?.isPaid && !group"
        class="rounded-2xl border border-oscuro-700 bg-oscuro-850 p-5 shadow-xl shadow-black/10"
      >
        <legend class="px-2 text-sm font-semibold text-green-300">
          Comprobante de pago ({{ formatCurrency(discipline.cost) }})
        </legend>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm text-oscuro-200">N° de operación</span>
            <input v-model="form.operationNumber" type="text" class="input" />
          </label>
          <label class="block">
            <span class="text-sm text-oscuro-200">Imagen del voucher</span>
            <input
              type="file"
              accept="image/*"
              class="input"
              @change="onFile"
            />
          </label>
        </div>
      </fieldset>

      <fieldset
        v-if="group && isExtra"
        class="rounded-2xl border border-oscuro-700 bg-oscuro-850 p-5 shadow-xl shadow-black/10"
      >
        <legend class="px-2 text-sm font-semibold text-green-300">
          Comprobante del equipo adicional ({{ formatCurrency(extraAmount) }})
        </legend>
        <label v-if="pendingExtras.length" class="mb-4 block">
          <span class="text-sm text-oscuro-200">Sumar a un comprobante adicional pendiente</span>
          <select v-model.number="form.extraVoucherId" class="input">
            <option :value="0">Adjuntar un comprobante nuevo</option>
            <option v-for="voucher in pendingExtras" :key="voucher.id" :value="voucher.id">
              Comprobante #{{ voucher.id }} · {{ voucher.teamIds.length }} equipo(s) ·
              {{ formatCurrency(voucher.amount) }}
            </option>
          </select>
        </label>
        <div v-if="!form.extraVoucherId" class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm text-oscuro-200">N° de operación</span>
            <input v-model="form.operationNumber" type="text" class="input" />
          </label>
          <label class="block">
            <span class="text-sm text-oscuro-200">Imagen del voucher</span>
            <input type="file" accept="image/*" class="input" @change="onFile" />
          </label>
        </div>
        <p v-else class="text-sm text-oscuro-300">
          El monto de ese comprobante se actualizará al sumar este equipo.
        </p>
      </fieldset>

      <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
      <p v-if="success" class="text-sm text-green-400">{{ success }}</p>

      <div class="flex flex-col gap-3 sm:flex-row">
        <button
          v-if="group"
          type="button"
          class="w-full rounded-lg bg-oscuro-700/70 px-5 py-3 font-semibold text-white transition hover:bg-oscuro-700 disabled:opacity-50 sm:w-auto"
          :disabled="submitting || !canRegister || blocked || resolving"
          @click="saveDraft"
        >
          {{ savingDraft ? 'Guardando…' : 'Guardar borrador' }}
        </button>
        <button
          type="submit"
          class="w-full rounded-lg bg-green-500 px-5 py-3 font-semibold text-oscuro-900 transition hover:bg-green-400 disabled:opacity-50"
          :disabled="submitting || !canRegister || blocked || resolving"
        >
          {{ submitting && !savingDraft ? 'Enviando...' : 'Enviar inscripción' }}
        </button>
      </div>
    </form>

    <AppConfirm
      v-model="leaveOpen"
      title="Cambios sin guardar"
      message="Hay cambios que no guardaste en este equipo. Si sales ahora se pierden."
      confirm-text="Salir sin guardar"
      cancel-text="Seguir editando"
      @confirm="leave"
    />
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next'
import type {
  ClassGroup,
  Discipline,
  EventPricing,
  Participant,
  SportEvent,
  Team,
} from '~/types/domain'
import { useAuthStore } from '~/stores/auth'
import { formatCurrency } from '~/utils/format'
import { activeTeams, apiMessage, extraFee, isValidDni, scopeLabel } from '~/utils/groups'
import {
  canUseParticipantType,
  countedParticipants,
  participantTypeLabel,
} from '~/utils/participants'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const api = useApi()
const auth = useAuthStore()
const roster = useRosterSearch()
const disciplineId = Number(route.params.id)
const groupId = Number(route.query.groupId) || 0

const discipline = ref<Discipline | null>(null)
const search = ref('')
const submitting = ref(false)
const savingDraft = ref(false)
const error = ref('')
const success = ref('')

// Modo grupo: el evento cobra por salón o ciclo y el equipo pertenece a un grupo.
const group = ref<ClassGroup | null>(null)
const pricing = ref<EventPricing | null>(null)
// Mientras se averigua si el evento cobra por salón o ciclo no se muestran ciclo/sección ni se envía.
const resolving = ref(true)
const blocked = ref(false)
// Equipo en borrador que se está editando (0 = equipo nuevo).
const editingId = ref(Number(route.query.teamId) || 0)
const editing = computed(() => editingId.value > 0)
// Códigos cuyo DNI llegó solo desde la API (solo para mostrar «Del padrón»).
const registryCodes = ref<Set<string>>(new Set())

const participantMode = computed<'STUDENT' | 'OTHER'>(
  () => discipline.value?.participantType ?? 'STUDENT',
)

const countedPlayers = computed(() =>
  countedParticipants(participantMode.value, form.participants),
)

const canRegister = computed(() => {
  if (!discipline.value || !auth.user) return false
  return canUseParticipantType(auth.user, discipline.value.participantType)
})

// El primer equipo de cada disciplina está incluido en el pago general; los demás son adicionales.
// Un borrador que ya existe conserva su comprobante: al editarlo no se pide otro.
const isExtra = computed(
  () => !editing.value && !!group.value && activeTeams(group.value, disciplineId).length >= 1,
)
const extraAmount = computed(() =>
  group.value && pricing.value ? extraFee(pricing.value, group.value.scope) : 0,
)
const pendingExtras = computed(
  () => group.value?.extraVouchers.filter((voucher) => voucher.status === 'PENDING') ?? [],
)

const form = reactive({
  teamName: '',
  phone: '',
  cycle: '',
  section: '',
  operationNumber: '',
  extraVoucherId: 0,
  participants: [] as Participant[],
  voucherFile: null as File | null,
})

// --- Volver y cambios sin guardar ---------------------------------------------------------------
const snapshot = ref('')
const leaveOpen = ref(false)

function serialize() {
  return JSON.stringify([form.teamName, form.phone, form.participants])
}
function markSaved() {
  snapshot.value = serialize()
}
const dirty = computed(() => !!group.value && !blocked.value && serialize() !== snapshot.value)

const backTo = computed(() =>
  group.value && discipline.value
    ? `/inscripcion/grupo/${discipline.value.eventId}`
    : discipline.value
      ? `/eventos/${discipline.value.eventId}`
      : '/eventos',
)
const backLabel = computed(() =>
  group.value ? 'Volver a mi salón o ciclo' : 'Volver al evento',
)

function goBack() {
  if (dirty.value) {
    leaveOpen.value = true
    return
  }
  navigateTo(backTo.value)
}

function leave() {
  leaveOpen.value = false
  snapshot.value = serialize()
  navigateTo(backTo.value)
}

function warnBeforeUnload(e: BeforeUnloadEvent) {
  if (!dirty.value) return
  e.preventDefault()
  e.returnValue = ''
}

onMounted(async () => {
  window.addEventListener('beforeunload', warnBeforeUnload)
  try {
    discipline.value = await api.get<Discipline>(`/disciplines/${disciplineId}`)
  } catch {
    discipline.value = null
    resolving.value = false
    return
  }
  try {
    await resolveGroupMode()
  } finally {
    resolving.value = false
    markSaved()
  }
})

onBeforeUnmount(() => window.removeEventListener('beforeunload', warnBeforeUnload))

/**
 * En eventos que cobran por salón o ciclo, las disciplinas de estudiantes se inscriben desde un
 * grupo: sin `groupId` se redirige al hub para elegirlo o crearlo.
 */
async function resolveGroupMode() {
  const current = discipline.value
  if (!current || current.participantType !== 'STUDENT') return

  let event: SportEvent
  try {
    event = await api.get<SportEvent>(`/events/${current.eventId}`)
  } catch {
    return
  }
  if (event.pricingMode !== 'PER_GROUP') return

  if (!groupId) {
    await navigateTo(`/inscripcion/grupo/${current.eventId}`, { replace: true })
    return
  }
  blocked.value = true
  try {
    const [loadedGroup, loadedPricing] = await Promise.all([
      api.get<ClassGroup>(`/groups/${groupId}`),
      api.get<EventPricing>(`/events/${current.eventId}/pricing`),
    ])
    group.value = loadedGroup
    pricing.value = loadedPricing
    blocked.value = false
  } catch (err) {
    error.value = apiMessage(err, 'No se pudo cargar tu salón o ciclo.')
    return
  }
  if (editing.value) await loadDraft()
}

/** Carga el borrador que se va a editar; si ya no es un borrador, el formulario queda bloqueado. */
async function loadDraft() {
  blocked.value = true
  try {
    const mine = await api.get<Team[]>('/registrations/mine')
    const team = mine.find((item) => item.id === editingId.value && item.groupId === groupId)
    if (!team) {
      error.value = 'No se encontró ese equipo en tu salón o ciclo.'
      return
    }
    if (team.status !== 'DRAFT') {
      error.value =
        'Este equipo ya fue enviado: solo un administrador puede modificarlo. Vuelve a tu salón o ciclo.'
      return
    }
    form.teamName = team.name
    form.phone = team.phone ?? ''
    form.participants = team.participants.map((p) => ({
      fullName: p.fullName,
      studentCode: p.studentCode ?? null,
      dni: p.dni ?? null,
      gender: p.gender ?? 'O',
      isDelegate: false,
      countsAsPlayer: true,
      isCaptain: p.isCaptain === true,
    }))
    blocked.value = false
  } catch (err) {
    error.value = apiMessage(err, 'No se pudo cargar el borrador.')
  }
}

async function reloadGroup() {
  try {
    group.value = await api.get<ClassGroup>(`/groups/${groupId}`)
  } catch {
    // El grupo anterior sigue siendo válido para mostrar la pantalla.
  }
}

function fromRegistry(p: Participant) {
  return !!p.studentCode && registryCodes.value.has(p.studentCode)
}

async function searchStudent() {
  if (!canRegister.value) {
    roster.searchError.value = 'Esta disciplina no corresponde a tu tipo de participante.'
    return
  }
  const hit = await roster.find(search.value, participantMode.value, form.participants)
  if (!hit) return
  if (hit.dniFromRegistry && hit.participant.studentCode) {
    registryCodes.value = new Set([...registryCodes.value, hit.participant.studentCode])
  }
  form.participants.push({
    ...hit.participant,
    // En un salón o ciclo, el primer jugador agregado queda como capitán/a hasta que se cambie.
    ...(group.value ? { isCaptain: form.participants.length === 0 } : {}),
  })
  search.value = ''
}

function removeParticipant(index: number) {
  form.participants.splice(index, 1)
  if (group.value && form.participants.length && !form.participants.some((p) => p.isCaptain)) {
    setCaptain(0)
  }
}

function setCaptain(index: number) {
  form.participants.forEach((p, i) => {
    p.isCaptain = i === index
  })
}

function onFile(e: Event) {
  const target = e.target as HTMLInputElement
  form.voucherFile = target.files?.[0] ?? null
}

/** Reglas de un equipo de salón o ciclo al enviarlo; la autoridad es el backend. */
function groupRosterError(): string {
  const captains = form.participants.filter((p) => p.isCaptain).length
  if (captains !== 1) return 'Designa exactamente un capitán/a.'
  const missing = form.participants.find((p) => !isValidDni(p.dni))
  if (missing) return `Falta el DNI (8 dígitos) de ${missing.fullName}.`
  if (isExtra.value && !form.voucherFile && !form.extraVoucherId) {
    return 'Adjunta el comprobante del equipo adicional.'
  }
  return ''
}

/** Campos comunes del equipo para crearlo (multipart); `draft` solo en salón o ciclo. */
function buildFormData(draft: boolean): FormData {
  const fd = new FormData()
  fd.append('disciplineId', String(disciplineId))
  fd.append('teamName', form.teamName)
  fd.append('phone', form.phone)
  fd.append('participants', JSON.stringify(form.participants))
  if (group.value) {
    // Ciclo y sección los fija el servidor desde el grupo.
    fd.append('groupId', String(group.value.id))
    if (draft) fd.append('draft', 'true')
    if (isExtra.value) {
      if (form.extraVoucherId) {
        fd.append('extraVoucherId', String(form.extraVoucherId))
      } else if (form.voucherFile) {
        fd.append('operationNumber', form.operationNumber)
        fd.append('voucher', form.voucherFile)
      }
    }
  } else {
    fd.append('cycle', form.cycle)
    fd.append('section', form.section)
    if (discipline.value?.isPaid) {
      fd.append('operationNumber', form.operationNumber)
      if (form.voucherFile) fd.append('voucher', form.voucherFile)
    }
  }
  return fd
}

/** Cambios que se envían al editar un borrador existente. */
function updatePayload() {
  return {
    teamName: form.teamName,
    phone: form.phone,
    participants: form.participants.map((p) => ({
      fullName: p.fullName,
      studentCode: p.studentCode ?? null,
      dni: p.dni?.trim() || null,
      gender: p.gender,
      isDelegate: false,
      countsAsPlayer: true,
      isCaptain: p.isCaptain === true,
    })),
  }
}

async function saveDraft() {
  error.value = ''
  success.value = ''
  if (!canRegister.value) {
    error.value = 'Esta disciplina no corresponde a tu tipo de participante.'
    return
  }
  if (!form.teamName.trim()) {
    error.value = 'Escribe el nombre del equipo.'
    return
  }
  if (discipline.value && countedPlayers.value > discipline.value.maxPlayers) {
    error.value = `El equipo puede tener hasta ${discipline.value.maxPlayers} jugadores. Tiene ${countedPlayers.value}.`
    return
  }
  if (!editing.value && isExtra.value && !form.voucherFile && !form.extraVoucherId) {
    error.value = 'Adjunta el comprobante del equipo adicional para guardarlo.'
    return
  }
  submitting.value = true
  savingDraft.value = true
  try {
    if (editing.value) {
      await api.patch(`/registrations/${editingId.value}`, updatePayload())
    } else {
      const created = await api.upload<{ id: number }>('/registrations', buildFormData(true))
      editingId.value = created.id
      form.voucherFile = null
      form.extraVoucherId = 0
      await navigateTo(
        { path: route.path, query: { groupId: String(groupId), teamId: String(created.id) } },
        { replace: true },
      )
      await reloadGroup()
    }
    markSaved()
    success.value = 'Borrador guardado. Puedes seguir editándolo o enviarlo cuando esté completo.'
  } catch (err: unknown) {
    error.value = apiMessage(err, 'No se pudo guardar el borrador.')
  } finally {
    submitting.value = false
    savingDraft.value = false
  }
}

async function submit() {
  error.value = ''
  success.value = ''
  if (!form.participants.length) {
    error.value = 'Agrega al menos un jugador.'
    return
  }
  if (!canRegister.value) {
    error.value = auth.user
      ? 'Esta disciplina no corresponde a tu tipo de participante.'
      : 'Inicia sesión para inscribirte.'
    return
  }
  if (
    participantMode.value === 'STUDENT' &&
    !group.value &&
    (!form.cycle.trim() || !form.section.trim())
  ) {
    error.value = 'Completa ciclo y sección del equipo.'
    return
  }
  if (
    discipline.value &&
    (countedPlayers.value < discipline.value.minPlayers ||
      countedPlayers.value > discipline.value.maxPlayers)
  ) {
    error.value = `El equipo debe tener entre ${discipline.value.minPlayers} y ${discipline.value.maxPlayers} jugadores. Tiene ${countedPlayers.value}.`
    return
  }
  if (group.value) {
    const rosterError = groupRosterError()
    if (rosterError) {
      error.value = rosterError
      return
    }
  } else if (discipline.value?.isPaid && !form.voucherFile) {
    error.value = 'Adjunta el comprobante de pago.'
    return
  }
  submitting.value = true
  try {
    if (group.value && editing.value) {
      // Se guardan los últimos cambios y se envía el mismo equipo.
      await api.patch(`/registrations/${editingId.value}`, updatePayload())
      await api.post(`/registrations/${editingId.value}/submit`)
    } else {
      await api.upload('/registrations', buildFormData(false))
    }
    markSaved()
    success.value = group.value
      ? 'Equipo enviado. Queda pendiente de validación.'
      : 'Inscripción enviada. Queda pendiente de validación.'
    const next = group.value
      ? `/inscripcion/grupo/${group.value.eventId}`
      : '/estado-inscripcion'
    setTimeout(() => navigateTo(next), 1200)
  } catch (err: unknown) {
    error.value = apiMessage(err, 'No se pudo enviar la inscripción.')
  } finally {
    submitting.value = false
  }
}
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
