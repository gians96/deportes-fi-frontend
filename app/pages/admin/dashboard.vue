<template>
  <div>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="card in cards"
        :key="card.label"
        class="rounded-xl border border-oscuro-700 bg-oscuro-850 p-5"
      >
        <div class="flex items-center justify-between">
          <p class="text-sm text-oscuro-300">{{ card.label }}</p>
          <component :is="card.icon" class="h-5 w-5 text-green-400" />
        </div>
        <p class="mt-2 text-3xl font-bold text-white">{{ card.value }}</p>
      </div>
    </div>

    <div class="mt-6 grid gap-4 lg:grid-cols-2">
      <AdminRegistrationsChart :labels="chartLabels" :values="chartValues" />
      <div class="rounded-xl border border-oscuro-700 bg-oscuro-850 p-5">
        <h3 class="mb-4 text-sm font-semibold text-oscuro-200">
          Acciones rápidas
        </h3>
        <div class="grid gap-3 sm:grid-cols-2">
          <NuxtLink
            v-for="action in actions"
            :key="action.to"
            :to="action.to"
            class="rounded-lg border border-oscuro-700 bg-oscuro-900/60 p-4 transition hover:border-green-500/40"
          >
            <component :is="action.icon" class="h-5 w-5 text-green-400" />
            <p class="mt-2 font-semibold text-white">{{ action.label }}</p>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Receipt,
  Users,
  CalendarRange,
  Trophy,
  Building2,
  Layers,
} from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'admin', middleware: 'admin' })

interface DashboardStats {
  pendingVouchers: number
  totalTeams: number
  totalParticipants: number
  activeEvents: number
  chartLabels: string[]
  chartValues: number[]
}

const api = useApi()
const stats = ref<DashboardStats>({
  pendingVouchers: 0,
  totalTeams: 0,
  totalParticipants: 0,
  activeEvents: 0,
  chartLabels: [],
  chartValues: [],
})

const cards = computed(() => [
  { label: 'Vouchers pendientes', value: stats.value.pendingVouchers, icon: Receipt },
  { label: 'Equipos inscritos', value: stats.value.totalTeams, icon: Users },
  { label: 'Participantes', value: stats.value.totalParticipants, icon: Users },
  { label: 'Eventos activos', value: stats.value.activeEvents, icon: CalendarRange },
])

const chartLabels = computed(() => stats.value.chartLabels)
const chartValues = computed(() => stats.value.chartValues)

const auth = useAuthStore()

const adminActions = [
  { to: '/admin/eventos', label: 'Crear evento', icon: CalendarRange },
  { to: '/admin/disciplinas', label: 'Nueva disciplina', icon: Trophy },
  { to: '/admin/inscripciones?payment=PAID', label: 'Equipos de pago', icon: Receipt },
  { to: '/admin/usuarios', label: 'Gestionar usuarios', icon: Building2 },
]

// El tesorero solo ve y valida pagos.
const treasuryActions = [
  { to: '/admin/inscripciones?payment=PAID', label: 'Equipos de pago', icon: Receipt },
  { to: '/admin/grupos', label: 'Salones y ciclos', icon: Layers },
]

const actions = computed(() => (auth.isTreasurer ? treasuryActions : adminActions))

onMounted(async () => {
  try {
    stats.value = await api.get<DashboardStats>('/admin/dashboard')
  } catch {
    /* mantiene valores por defecto */
  }
})
</script>
