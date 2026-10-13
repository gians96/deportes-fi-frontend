<template>
  <div>
    <NuxtLink
      to="/eventos"
      class="inline-flex items-center gap-1 text-sm text-oscuro-300 hover:text-white"
    >
      <ChevronLeft class="h-4 w-4" /> Eventos
    </NuxtLink>

    <div v-if="event" class="mt-4">
      <div class="rounded-2xl border border-oscuro-700 bg-oscuro-850 p-6">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-white">{{ event.name }}</h1>
            <RichTextContent
              v-if="event.description"
              class="mt-2"
              :content="event.description"
            />
          </div>
          <span
            class="rounded-full px-3 py-1 text-xs font-semibold"
            :class="
              event.isOpen
                ? 'bg-green-500/10 text-green-300'
                : 'bg-oscuro-700 text-oscuro-300'
            "
          >
            {{ event.isOpen ? 'Inscripciones abiertas' : 'Cerrado' }}
          </span>
        </div>
        <p class="mt-3 text-sm text-oscuro-400">
          {{ formatDateUtc(event.startDate) }} — {{ formatDateUtc(event.endDate) }}
        </p>
      </div>

      <div
        v-if="event.pricingMode === 'PER_GROUP'"
        class="mt-6 rounded-2xl border border-green-500/30 bg-green-500/5 p-6"
      >
        <h2 class="text-lg font-bold text-white">Inscripción por salón o ciclo</h2>
        <p class="mt-1 text-sm text-oscuro-200">
          Un solo pago general cubre un equipo en cada disciplina. Cada equipo adicional en una
          misma disciplina paga aparte.
        </p>
        <ul v-if="pricing" class="mt-3 grid gap-2 text-sm text-oscuro-200 sm:grid-cols-2">
          <li>Salón: <b class="text-green-300">{{ formatCurrency(pricing.sectionBase) }}</b></li>
          <li>Ciclo completo: <b class="text-green-300">{{ formatCurrency(pricing.cycleBase) }}</b></li>
          <li>Equipo adicional (salón): <b class="text-green-300">{{ formatCurrency(pricing.sectionExtra) }}</b></li>
          <li>Equipo adicional (ciclo): <b class="text-green-300">{{ formatCurrency(pricing.cycleExtra) }}</b></li>
        </ul>
        <NuxtLink
          v-if="auth.user"
          :to="`/inscripcion/grupo/${event.id}`"
          class="mt-4 inline-flex rounded-lg bg-green-500 px-5 py-2.5 font-semibold text-oscuro-900 transition hover:bg-green-400"
        >
          Inscribir mi salón o ciclo
        </NuxtLink>
        <NuxtLink
          v-else
          :to="{ path: '/login', query: { redirect: `/eventos/${event.id}` } }"
          class="mt-4 inline-flex rounded-lg bg-green-500 px-5 py-2.5 font-semibold text-oscuro-900 transition hover:bg-green-400"
        >
          Iniciar sesión para inscribirme
        </NuxtLink>
      </div>

      <h2 class="mt-8 text-xl font-bold text-white">Disciplinas</h2>
      <div
        v-if="visibleDisciplines.length"
        class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <DisciplineCard
          v-for="d in visibleDisciplines"
          :key="d.id"
          :discipline="d"
          :included-in-group="event.pricingMode === 'PER_GROUP' && d.participantType === 'STUDENT'"
        />
      </div>
      <div
        v-else
        class="mt-4 rounded-xl border border-dashed border-oscuro-700 bg-oscuro-850 p-10 text-center text-oscuro-400"
      >
        No hay disciplinas disponibles para tu tipo de participante.
      </div>
    </div>

    <div v-else class="mt-6 text-oscuro-400">Cargando evento…</div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next'
import type { EventPricing, SportEvent } from '~/types/domain'
import { useEventsStore } from '~/stores/events'
import { useAuthStore } from '~/stores/auth'
import { formatCurrency, formatDateUtc } from '~/utils/format'
import { userParticipantTypes } from '~/utils/participants'

const route = useRoute()
const store = useEventsStore()
const auth = useAuthStore()
const eventId = Number(route.params.id)
const event = ref<SportEvent | null>(null)
const pricing = ref<EventPricing | null>(null)

const visibleDisciplines = computed(() => {
  if (!auth.user) return store.disciplines
  const types = userParticipantTypes(auth.user)
  return store.disciplines.filter((d) => types.includes(d.participantType))
})

onMounted(async () => {
  const api = useApi()
  try {
    event.value = await api.get<SportEvent>(`/events/${eventId}`)
  } catch {
    event.value = null
  }
  if (event.value?.pricingMode === 'PER_GROUP' && auth.user) {
    try {
      pricing.value = await api.get<EventPricing>(`/events/${eventId}/pricing`)
    } catch {
      pricing.value = null
    }
  }
  await store.fetchDisciplines(eventId)
})
</script>
