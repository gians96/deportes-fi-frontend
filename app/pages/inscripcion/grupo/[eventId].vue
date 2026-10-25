<template>
  <div class="mx-auto max-w-5xl">
    <NuxtLink
      :to="`/eventos/${eventId}`"
      class="inline-flex items-center gap-1 text-sm text-oscuro-300 hover:text-white"
    >
      <ChevronLeft class="h-4 w-4" /> Volver al evento
    </NuxtLink>

    <h1 class="mt-4 text-2xl font-bold text-white">Mi salón o ciclo</h1>
    <p class="mt-1 text-oscuro-300">
      Un solo pago general cubre un equipo en cada disciplina. Cada equipo adicional en una misma
      disciplina paga aparte.
    </p>

    <p v-if="loading" class="mt-6 text-oscuro-400">Cargando…</p>

    <div
      v-else-if="!event"
      class="mt-6 rounded-xl border border-dashed border-oscuro-700 bg-oscuro-850 p-8 text-center text-oscuro-400"
    >
      No se encontró el evento.
    </div>

    <div
      v-else-if="event.pricingMode !== 'PER_GROUP'"
      class="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-200"
    >
      Este evento no cobra por salón o ciclo. Inscribe tu equipo desde la disciplina.
      <NuxtLink :to="`/eventos/${eventId}`" class="font-semibold underline">Ver disciplinas</NuxtLink>
    </div>

    <template v-else>
      <div v-if="pricing" class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="fee in fees" :key="fee.label" class="rounded-xl bg-oscuro-850 p-4">
          <p class="text-xs text-oscuro-400">{{ fee.label }}</p>
          <p class="mt-1 text-lg font-bold text-green-400">{{ formatCurrency(fee.value) }}</p>
        </div>
      </div>

      <p
        v-if="createSuccess"
        class="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300"
      >
        {{ createSuccess }}
      </p>
      <p
        v-if="actionError"
        class="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
      >
        {{ actionError }}
      </p>

      <!-- Mis salones y ciclos -->
      <section v-for="group in groups" :key="group.id" class="mt-8 rounded-2xl border border-oscuro-700 bg-oscuro-850 p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-normal text-green-300">
              {{ scopeLabel(group.scope) }}
            </p>
            <h2 class="mt-1 text-xl font-bold text-white">{{ group.label }}</h2>
          </div>
        </div>

        <div class="mt-4 space-y-3">
          <GroupVoucherPanel
            v-if="group.baseVoucher"
            :voucher="group.baseVoucher"
            title="Pago general"
            :subtitle="`Cubre un equipo por disciplina (${scopeLabel(group.scope).toLowerCase()})`"
            @replaced="loadGroups"
          />
          <GroupVoucherPanel
            v-for="extra in group.extraVouchers"
            :key="extra.id"
            :voucher="extra"
            title="Equipo adicional"
            :subtitle="`Cubre ${extra.teamIds.length} equipo(s)`"
            @replaced="loadGroups"
          />
        </div>

        <h3 class="mt-6 text-sm font-semibold text-oscuro-200">Equipos por disciplina</h3>
        <p v-if="pricing" class="mt-1 text-xs text-oscuro-400">
          El primer equipo de cada disciplina va incluido en el pago general. Cada equipo adicional en la
          misma disciplina cuesta {{ formatCurrency(extraFee(pricing, group.scope)) }} y lleva su propio
          comprobante.
        </p>
        <p
          v-if="group.draftCount > 0"
          class="mt-3 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-200"
        >
          Tienes {{ group.draftCount }} equipo(s) en borrador: no se revisan hasta que los envíes.
        </p>

        <ul class="mt-2 divide-y divide-oscuro-800">
          <li
            v-for="discipline in group.disciplines"
            :key="discipline.disciplineId"
            class="flex flex-wrap items-start justify-between gap-3 py-3"
          >
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-white">{{ discipline.name }}</p>
              <ul v-if="discipline.teams.length" class="mt-2 space-y-2">
                <li
                  v-for="team in discipline.teams"
                  :key="team.id"
                  class="rounded-lg bg-oscuro-900/50 px-3 py-2"
                >
                  <div class="flex flex-wrap items-center gap-2 text-sm text-oscuro-200">
                    <span class="font-semibold text-white">{{ team.name }}</span>
                    <span
                      v-if="team.slot"
                      class="rounded-md bg-oscuro-900/70 px-2 py-0.5 text-xs text-oscuro-300"
                    >
                      {{ slotLabel(team.slot) }}
                    </span>
                    <StatusBadge :status="team.status" />
                  </div>
                  <p
                    v-if="team.status === 'REJECTED' && team.rejectionReason"
                    class="mt-1 text-xs text-red-300"
                  >
                    Motivo: {{ team.rejectionReason }}
                  </p>
                  <div
                    v-if="team.status === 'OBSERVED'"
                    class="mt-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs text-orange-200"
                  >
                    <p class="font-semibold">El administrador observó este equipo</p>
                    <p v-if="team.observation" class="mt-1">{{ team.observation }}</p>
                    <button
                      type="button"
                      class="mt-2 rounded-lg bg-orange-500/20 px-3 py-1.5 font-semibold text-orange-100 hover:bg-orange-500/30 disabled:opacity-50"
                      :disabled="busyTeamId === team.id"
                      @click="openCorrect(team.id)"
                    >
                      Corregir y reenviar
                    </button>
                  </div>
                  <div
                    v-if="team.status === 'DRAFT' && event.isOpen"
                    class="mt-2 flex flex-wrap items-center gap-2"
                  >
                    <NuxtLink
                      :to="editLink(group, discipline.disciplineId, team.id)"
                      class="rounded-lg bg-oscuro-700/60 px-3 py-1.5 text-xs font-semibold text-oscuro-100 hover:bg-oscuro-700"
                    >
                      Editar
                    </NuxtLink>
                    <button
                      type="button"
                      class="rounded-lg bg-green-500/15 px-3 py-1.5 text-xs font-semibold text-green-300 hover:bg-green-500/25 disabled:opacity-50"
                      :disabled="busyTeamId === team.id"
                      @click="submitTeam(team.id)"
                    >
                      {{ busyTeamId === team.id ? 'Enviando…' : 'Enviar' }}
                    </button>
                    <button
                      type="button"
                      class="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                      :disabled="busyTeamId === team.id"
                      @click="askRemove(team.id, team.name)"
                    >
                      Quitar
                    </button>
                  </div>
                </li>
              </ul>
              <p v-else class="mt-1 text-xs text-oscuro-400">Sin equipo todavía</p>
            </div>
            <NuxtLink
              v-if="event.isOpen"
              :to="`/inscripcion/${discipline.disciplineId}?groupId=${group.id}`"
              class="shrink-0 rounded-lg bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300 transition hover:bg-green-500/20"
            >
              {{ registerLabel(group, discipline.disciplineId) }}
            </NuxtLink>
          </li>
        </ul>
      </section>

      <!-- Nuevo salón o ciclo: un estudiante tiene un solo salón o ciclo activo por evento -->
      <section class="mt-8 rounded-2xl border border-oscuro-700 bg-oscuro-850 p-5">
        <template v-if="hasActiveGroup">
          <h2 class="text-lg font-bold text-white">Ya inscribiste tu salón o ciclo</h2>
          <p class="mt-1 text-sm text-oscuro-300">
            Para sumar más equipos de tu salón usa «+ Equipo adicional» en cada disciplina. Si necesitas
            inscribir otro salón o ciclo, pide ayuda a un administrador.
          </p>
        </template>
        <template v-else>
          <h2 class="text-lg font-bold text-white">
            {{ groups.length ? 'Inscribir de nuevo mi salón o ciclo' : 'Inscribir mi salón o ciclo' }}
          </h2>
          <p class="mt-1 text-sm text-oscuro-300">
            Elige si participa un salón o el ciclo completo. Un ciclo completo reúne a todas sus
            secciones, por eso no puede inscribirse a la vez que salones sueltos de ese ciclo. Solo puedes
            inscribir un salón o ciclo por evento.
          </p>

          <form v-if="event.isOpen" class="mt-4 grid gap-4 sm:grid-cols-2" @submit.prevent="createGroup">
            <div class="flex gap-2 sm:col-span-2">
              <button
                v-for="option in scopes"
                :key="option.value"
                type="button"
                class="rounded-lg px-4 py-2 text-sm font-semibold transition"
                :class="
                  form.scope === option.value
                    ? 'bg-green-500/15 text-green-300'
                    : 'bg-oscuro-900/60 text-oscuro-300 hover:bg-oscuro-800'
                "
                @click="form.scope = option.value"
              >
                {{ option.label }}
              </button>
            </div>

            <label class="block sm:col-span-2">
              <span class="text-sm text-oscuro-200">Escuela profesional</span>
              <select v-model.number="form.schoolId" required class="input">
                <option :value="0" disabled>Selecciona tu escuela</option>
                <option v-for="school in schools" :key="school.id" :value="school.id">
                  {{ school.name }}
                </option>
              </select>
            </label>
            <label class="block">
              <span class="text-sm text-oscuro-200">Ciclo</span>
              <input v-model="form.cycle" type="text" required class="input" placeholder="Ej. V o 5" />
            </label>
            <label v-if="form.scope === 'SECTION'" class="block">
              <span class="text-sm text-oscuro-200">Sección</span>
              <input v-model="form.section" type="text" required class="input" placeholder="Ej. A1" />
            </label>

            <div class="rounded-xl bg-oscuro-900/60 p-4 sm:col-span-2">
              <p class="text-xs text-oscuro-400">Pago general a depositar</p>
              <p class="text-2xl font-bold text-green-400">{{ formatCurrency(fee) }}</p>
            </div>

            <label class="block">
              <span class="text-sm text-oscuro-200">N° de operación</span>
              <input v-model="form.operationNumber" type="text" class="input" />
            </label>
            <label class="block">
              <span class="text-sm text-oscuro-200">Imagen del comprobante</span>
              <input type="file" accept="image/*" required class="input" @change="onFile" />
            </label>

            <p v-if="createError" class="text-sm text-red-400 sm:col-span-2">{{ createError }}</p>
            <button
              type="submit"
              class="rounded-lg bg-green-500 px-5 py-3 font-semibold text-oscuro-900 transition hover:bg-green-400 disabled:opacity-50 sm:col-span-2"
              :disabled="creating"
            >
              {{ creating ? 'Enviando…' : 'Enviar pago y crear' }}
            </button>
          </form>
          <p v-else class="mt-4 text-sm text-oscuro-400">Las inscripciones de este evento están cerradas.</p>
        </template>
      </section>
    </template>

    <!-- Corrección de un equipo observado: se edita y se reenvía sin plazo -->
    <AppModal
      v-model="correctOpen"
      :title="correctTeam ? `Corregir «${correctTeam.name}»` : 'Corregir equipo'"
      size="4xl"
    >
      <TeamEditForm
        v-if="correctTeam"
        :key="correctTeam.id"
        :team="correctTeam"
        resubmit
        @saved="onCorrected"
        @refresh="loadGroups"
        @cancel="correctOpen = false"
      />
    </AppModal>

    <AppConfirm
      v-model="removeOpen"
      title="Quitar borrador"
      :message="`Se eliminará el borrador «${removeName}» y quedará libre su cupo. ¿Continuar?`"
      confirm-text="Quitar borrador"
      :loading="removing"
      :error="removeError"
      @confirm="confirmRemove"
    />
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next'
import type { ClassGroup, EventPricing, GroupScope, SportEvent, Team } from '~/types/domain'
import { formatCurrency } from '~/utils/format'
import {
  activeTeams,
  apiMessage,
  baseFee,
  extraFee,
  isActiveGroup,
  scopeLabel,
  slotLabel,
} from '~/utils/groups'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const api = useApi()
const { faculties, load: loadFaculties } = useFaculties()

const eventId = Number(route.params.eventId)
const event = ref<SportEvent | null>(null)
const pricing = ref<EventPricing | null>(null)
const groups = ref<ClassGroup[]>([])
const loading = ref(true)

const scopes: { label: string; value: GroupScope }[] = [
  { label: 'Un salón', value: 'SECTION' },
  { label: 'Ciclo completo', value: 'CYCLE' },
]

const form = reactive({
  scope: 'SECTION' as GroupScope,
  schoolId: 0,
  cycle: '',
  section: '',
  operationNumber: '',
  voucherFile: null as File | null,
})
const creating = ref(false)
const createError = ref('')
const createSuccess = ref('')
const actionError = ref('')

const busyTeamId = ref(0)
const correctOpen = ref(false)
const correctTeam = ref<Team | null>(null)
const removeOpen = ref(false)
const removeId = ref(0)
const removeName = ref('')
const removing = ref(false)
const removeError = ref('')

const schools = computed(() => {
  const faculty = faculties.value.find((item) => item.id === event.value?.facultyId)
  const list = faculty?.schools ?? []
  return event.value?.schoolId ? list.filter((s) => s.id === event.value?.schoolId) : list
})

const fee = computed(() => (pricing.value ? baseFee(pricing.value, form.scope) : 0))

/** Un estudiante tiene un solo salón o ciclo activo por evento (el servidor lo hace cumplir). */
const hasActiveGroup = computed(() => groups.value.some(isActiveGroup))

const fees = computed(() =>
  pricing.value
    ? [
        { label: 'Pago general por salón', value: pricing.value.sectionBase },
        { label: 'Pago general por ciclo completo', value: pricing.value.cycleBase },
        { label: 'Equipo adicional (salón)', value: pricing.value.sectionExtra },
        { label: 'Equipo adicional (ciclo completo)', value: pricing.value.cycleExtra },
      ]
    : [],
)

function registerLabel(group: ClassGroup, disciplineId: number) {
  if (!activeTeams(group, disciplineId).length) return 'Registrar equipo'
  const amount = pricing.value ? formatCurrency(extraFee(pricing.value, group.scope)) : ''
  return `+ Equipo adicional${amount ? ` · ${amount}` : ''}`
}

function editLink(group: ClassGroup, disciplineId: number, teamId: number) {
  return `/inscripcion/${disciplineId}?groupId=${group.id}&teamId=${teamId}`
}

function onFile(e: Event) {
  form.voucherFile = (e.target as HTMLInputElement).files?.[0] ?? null
}

async function loadGroups() {
  try {
    groups.value = await api.get<ClassGroup[]>('/groups/mine', { eventId })
  } catch {
    groups.value = []
  }
}

/** Carga el equipo observado completo (con su nómina) y abre el editor de corrección. */
async function openCorrect(teamId: number) {
  actionError.value = ''
  busyTeamId.value = teamId
  try {
    const mine = await api.get<Team[]>('/registrations/mine')
    const team = mine.find((item) => item.id === teamId)
    if (!team) {
      actionError.value = 'No se encontró ese equipo en tus inscripciones. Pide ayuda a un administrador.'
      return
    }
    correctTeam.value = team
    correctOpen.value = true
  } catch (err) {
    actionError.value = apiMessage(err, 'No se pudo abrir el equipo.')
  } finally {
    busyTeamId.value = 0
  }
}

async function onCorrected(resubmitted: boolean) {
  correctOpen.value = false
  createSuccess.value = resubmitted
    ? 'Equipo reenviado: el administrador lo revisará de nuevo.'
    : 'Cambios guardados. El equipo sigue observado hasta que lo reenvíes.'
  await loadGroups()
}

async function submitTeam(teamId: number) {
  actionError.value = ''
  busyTeamId.value = teamId
  try {
    await api.post(`/registrations/${teamId}/submit`)
    await loadGroups()
  } catch (err) {
    actionError.value = apiMessage(err, 'No se pudo enviar el equipo.')
  } finally {
    busyTeamId.value = 0
  }
}

function askRemove(teamId: number, name: string) {
  removeId.value = teamId
  removeName.value = name
  removeError.value = ''
  removeOpen.value = true
}

async function confirmRemove() {
  removing.value = true
  removeError.value = ''
  try {
    await api.del(`/registrations/${removeId.value}`)
    removeOpen.value = false
    await loadGroups()
  } catch (err) {
    removeError.value = apiMessage(err, 'No se pudo quitar el borrador.')
  } finally {
    removing.value = false
  }
}

async function createGroup() {
  createError.value = ''
  createSuccess.value = ''
  if (!form.schoolId) {
    createError.value = 'Selecciona tu escuela profesional.'
    return
  }
  if (!form.cycle.trim() || (form.scope === 'SECTION' && !form.section.trim())) {
    createError.value =
      form.scope === 'SECTION' ? 'Completa el ciclo y la sección.' : 'Completa el ciclo.'
    return
  }
  if (!form.voucherFile) {
    createError.value = 'Adjunta el comprobante del pago general.'
    return
  }
  creating.value = true
  try {
    const fd = new FormData()
    fd.append('eventId', String(eventId))
    fd.append('scope', form.scope)
    fd.append('schoolId', String(form.schoolId))
    fd.append('cycle', form.cycle)
    if (form.scope === 'SECTION') fd.append('section', form.section)
    fd.append('operationNumber', form.operationNumber)
    fd.append('voucher', form.voucherFile)
    await api.upload<ClassGroup>('/groups', fd)
    createSuccess.value = 'Pago enviado. Ahora registra los equipos de cada disciplina.'
    form.cycle = ''
    form.section = ''
    form.operationNumber = ''
    form.voucherFile = null
    await loadGroups()
  } catch (err) {
    createError.value = apiMessage(err, 'No se pudo registrar tu salón o ciclo.')
  } finally {
    creating.value = false
  }
}

onMounted(async () => {
  try {
    event.value = await api.get<SportEvent>(`/events/${eventId}`)
  } catch {
    event.value = null
  }
  if (event.value?.pricingMode === 'PER_GROUP') {
    await Promise.all([
      loadFaculties(),
      loadGroups(),
      api
        .get<EventPricing>(`/events/${eventId}/pricing`)
        .then((value) => {
          pricing.value = value
        })
        .catch(() => {
          pricing.value = null
        }),
    ])
  }
  loading.value = false
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
