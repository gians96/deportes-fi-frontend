<template>
  <div class="mx-auto max-w-5xl">
    <h1 class="text-2xl font-bold text-white">Inscripción de equipo</h1>
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

    <p v-if="discipline && !canRegister" class="mt-3 text-sm text-amber-300">
      Esta disciplina no corresponde a tu tipo de participante.
    </p>

    <form class="mt-6 space-y-6" @submit.prevent="submit">
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
            />
          </label>
          <button
            type="button"
            class="h-[46px] rounded-lg bg-green-500/15 px-5 font-semibold text-green-300 transition hover:bg-green-500/25 disabled:opacity-60"
            :disabled="searching"
            @click="searchStudent"
          >
            {{ searching ? 'Buscando...' : 'Buscar' }}
          </button>
        </div>
        <p v-if="searchError" class="mt-2 text-sm text-red-400">
          {{ searchError }}
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

      <button
        type="submit"
        class="w-full rounded-lg bg-green-500 px-5 py-3 font-semibold text-oscuro-900 transition hover:bg-green-400 disabled:opacity-50"
        :disabled="submitting || !canRegister || blocked || resolving"
      >
        {{ submitting ? 'Enviando...' : 'Enviar inscripción' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import type {
  AcademicStudent,
  ClassGroup,
  Discipline,
  EventPricing,
  Participant,
  SportEvent,
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
const disciplineId = Number(route.params.id)
const groupId = Number(route.query.groupId) || 0

const discipline = ref<Discipline | null>(null)
const search = ref('')
const searching = ref(false)
const searchError = ref('')
const submitting = ref(false)
const error = ref('')
const success = ref('')

// Modo grupo: el evento cobra por salón o ciclo y el equipo pertenece a un grupo.
const group = ref<ClassGroup | null>(null)
const pricing = ref<EventPricing | null>(null)
// Mientras se averigua si el evento cobra por salón o ciclo no se muestran ciclo/sección ni se envía.
const resolving = ref(true)
const blocked = ref(false)

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
const isExtra = computed(
  () => !!group.value && activeTeams(group.value, disciplineId).length >= 1,
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

onMounted(async () => {
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
  }
})

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
  }
}

async function searchStudent() {
  if (!canRegister.value) {
    searchError.value = 'Esta disciplina no corresponde a tu tipo de participante.'
    return
  }
  const q = search.value.trim()
  if (!q) return
  searching.value = true
  searchError.value = ''
  try {
    let person: AcademicStudent
    if (participantMode.value === 'OTHER') {
      if (!/^\d{8}$/.test(q)) {
        searchError.value = 'Ingresa un DNI válido de 8 dígitos.'
        return
      }
      person = await api.get<AcademicStudent>('/academic/dni', { numero: q })
    } else {
      person = await api.get<AcademicStudent>('/academic/student', {
        buscador: q,
      })
    }
    const code = person.studentCode?.trim() || null
    const dni = person.dni?.trim() || (/^\d{8}$/.test(q) ? q : null)
    const already = form.participants.some(
      (p) =>
        (code && p.studentCode === code) ||
        (dni && p.dni === dni) ||
        (p.fullName.toLowerCase() === person.fullName.toLowerCase() &&
          (!code || !p.studentCode) &&
          (!dni || !p.dni)),
    )
    if (already) {
      searchError.value = 'Esa persona ya fue agregada.'
      return
    }
    form.participants.push({
      fullName: person.fullName.replace(/\s+/g, ' ').trim(),
      studentCode: code,
      dni,
      gender: 'O',
      isDelegate: false,
      countsAsPlayer: true,
      // En un salón o ciclo, el primer jugador agregado queda como capitán/a hasta que se cambie.
      ...(group.value ? { isCaptain: form.participants.length === 0 } : {}),
    })
    search.value = ''
  } catch {
    searchError.value =
      participantMode.value === 'OTHER'
        ? 'No se encontró una persona con ese DNI.'
        : 'No se encontró un estudiante único con ese código.'
  } finally {
    searching.value = false
  }
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

/** Reglas de un equipo de salón o ciclo; la autoridad es el backend. */
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
    const fd = new FormData()
    fd.append('disciplineId', String(disciplineId))
    fd.append('teamName', form.teamName)
    fd.append('phone', form.phone)
    fd.append('participants', JSON.stringify(form.participants))
    if (group.value) {
      // Ciclo y sección los fija el servidor desde el grupo.
      fd.append('groupId', String(group.value.id))
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
    await api.upload('/registrations', fd)
    success.value = group.value
      ? 'Equipo registrado. Queda pendiente de validación.'
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
