<template>
  <div v-if="discipline">
    <NuxtLink
      :to="`/eventos/${discipline.eventId}`"
      class="inline-flex items-center gap-1 text-sm text-oscuro-300 hover:text-white"
    >
      <ChevronLeft class="h-4 w-4" /> Volver al evento
    </NuxtLink>

    <div class="mt-4 rounded-2xl border border-oscuro-700 bg-oscuro-850 p-6">
      <h1 class="text-2xl font-bold text-white">{{ discipline.name }}</h1>
      <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div class="rounded-lg bg-oscuro-900/60 p-3">
          <p class="text-xs text-oscuro-400">Modalidad</p>
          <p class="font-semibold text-white">
            {{ discipline.modality === 'TEAM' ? 'Por equipos' : 'Individual' }}
          </p>
        </div>
        <div class="rounded-lg bg-oscuro-900/60 p-3">
          <p class="text-xs text-oscuro-400">Participantes</p>
          <p class="font-semibold text-white">
            {{ participantTypeLabel(discipline.participantType) }}
          </p>
        </div>
        <div class="rounded-lg bg-oscuro-900/60 p-3">
          <p class="text-xs text-oscuro-400">Jugadores</p>
          <p class="font-semibold text-white">
            {{ discipline.minPlayers }} - {{ discipline.maxPlayers }}
          </p>
        </div>
        <div class="rounded-lg bg-oscuro-900/60 p-3">
          <p class="text-xs text-oscuro-400">Costo</p>
          <p class="font-semibold text-white">
            {{ costLabel }}
          </p>
        </div>
        <div class="rounded-lg bg-oscuro-900/60 p-3">
          <p class="text-xs text-oscuro-400">Cierre de inscripción</p>
          <p class="font-semibold text-white">
            {{ formatDateTime(discipline.registrationDeadline) }}
          </p>
        </div>
      </div>
      <div class="mt-6 flex flex-wrap gap-3">
        <NuxtLink
          v-if="!auth.user"
          :to="{ path: '/login', query: { redirect: `/disciplinas/${discipline.id}` } }"
          class="rounded-lg bg-green-500 px-5 py-2.5 font-semibold text-oscuro-900 transition hover:bg-green-400"
        >
          Iniciar sesión para inscribirme
        </NuxtLink>
        <NuxtLink
          v-else-if="canRegister"
          :to="registerLink"
          class="rounded-lg bg-green-500 px-5 py-2.5 font-semibold text-oscuro-900 transition hover:bg-green-400"
        >
          {{ registerLabel }}
        </NuxtLink>
        <span
          v-else
          class="rounded-lg border border-amber-500/30 bg-amber-500/10 px-5 py-2.5 font-semibold text-amber-300"
        >
          No disponible para tu tipo de participante
        </span>
        <NuxtLink
          :to="`/resultados/${discipline.id}`"
          class="rounded-lg border border-oscuro-600 px-5 py-2.5 font-semibold text-oscuro-100 transition hover:bg-oscuro-800"
        >
          Ver resultados
        </NuxtLink>
      </div>
      <div v-if="discipline.rulesText" class="mt-6">
        <h3 class="text-sm font-semibold text-oscuro-200">Bases</h3>
        <RichTextContent class="mt-1" :content="discipline.rulesText" />
      </div>

      <div v-if="discipline.extraInfo" class="mt-4">
        <h3 class="text-sm font-semibold text-oscuro-200">
          Información adicional
        </h3>
        <RichTextContent class="mt-1" :content="discipline.extraInfo" />
      </div>

      

      <div class="mt-8">
        <h2 class="text-lg font-bold text-white">Equipos inscritos</h2>
        <div
          v-if="registeredTeams.length"
          class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <article
            v-for="(team, index) in registeredTeams"
            :key="team.id"
            class="rounded-xl border border-oscuro-700 bg-oscuro-900/60 p-4 transition hover:border-green-500/40 hover:bg-oscuro-850"
          >
            <div class="flex items-start gap-3">
              <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-green-500/10 text-sm font-bold text-green-300">
                {{ index + 1 }}
              </span>
              <div class="min-w-0">
                <p class="truncate font-bold text-white">{{ team.name }}</p>
                <p class="mt-1 text-xs text-oscuro-400">
                  {{ teamCycleSection(team) }}
                </p>
              </div>
            </div>
          </article>
        </div>
        <p
          v-else
          class="mt-3 rounded-xl border border-dashed border-oscuro-700 bg-oscuro-900/60 p-6 text-center text-sm text-oscuro-400"
        >
          Aún no hay equipos inscritos.
        </p>
      </div>
    </div>
  </div>
  <div v-else class="text-oscuro-400">Cargando disciplina…</div>
</template>

<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next'
import type { Discipline, DisciplineTeamSummary, PricingMode, SportEvent } from '~/types/domain'
import { useAuthStore } from '~/stores/auth'
import { formatCurrency, formatDateTime } from '~/utils/format'
import { canUseParticipantType, participantTypeLabel } from '~/utils/participants'

const route = useRoute()
const auth = useAuthStore()
const api = useApi()

const { data: discipline } = await useAsyncData<Discipline | null>(
  `discipline-${route.params.id}`,
  async () => {
    try {
      return await api.get<Discipline>(`/disciplines/${Number(route.params.id)}`)
    } catch {
      return null
    }
  },
  { default: () => null },
)

// Modo de cobro del evento: en "por salón o ciclo" la disciplina va dentro del pago del grupo.
const pricingMode = ref<PricingMode | null>(null)
onMounted(async () => {
  if (!discipline.value) return
  try {
    const event = await api.get<SportEvent>(`/events/${discipline.value.eventId}`)
    pricingMode.value = event.pricingMode ?? null
  } catch {
    pricingMode.value = null
  }
})

const byGroup = computed(
  () => pricingMode.value === 'PER_GROUP' && discipline.value?.participantType === 'STUDENT',
)
const costLabel = computed(() => {
  if (byGroup.value) return 'Incluido en el pago del salón o ciclo'
  return discipline.value?.isPaid ? formatCurrency(discipline.value.cost) : 'Gratuito'
})
const registerLink = computed(() =>
  byGroup.value
    ? `/inscripcion/grupo/${discipline.value?.eventId}`
    : `/inscripcion/${discipline.value?.id}`,
)
const registerLabel = computed(() =>
  byGroup.value ? 'Inscribir mi salón o ciclo' : 'Inscribir equipo',
)

const canRegister = computed(() => {
  if (!discipline.value || !auth.user) return false
  return canUseParticipantType(auth.user, discipline.value.participantType)
})

const registeredTeams = computed(
  () => discipline.value?.teams?.filter((team) => team.status === 'APPROVED') ?? [],
)

function teamCycleSection(team: DisciplineTeamSummary) {
  if (!team.cycle && !team.section) return 'Sin ciclo ni sección'
  return `${team.cycle || 's/ciclo'} - ${team.section || 's/sección'}`
}
</script>
