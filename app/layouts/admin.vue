<template>
  <div class="admin-layout min-h-screen bg-black">
    <!-- Sidebar desktop -->
    <aside
      class="fixed left-0 top-0 z-50 hidden h-full w-64 flex-col border-r border-oscuro-700 bg-oscuro-900/80 backdrop-blur-lg lg:flex"
    >
      <div class="border-b border-oscuro-700 p-6">
        <div class="flex items-center gap-4">
          <img
            src="/es-undc.png"
            alt="Universidad Nacional de Cañete"
            class="h-10 w-auto shrink-0"
          />
          <div>
            <h1 class="text-xl font-bold text-white">
              FI <span class="text-green-400 glow-text">{{ auth.isReferee ? 'Árbitro' : auth.isTreasurer ? 'Tesorería' : 'Admin' }}</span>
            </h1>
            <p class="text-sm text-oscuro-300">
              {{ auth.isReferee ? 'Gestión de fixture' : auth.isTreasurer ? 'Validación de pagos' : 'Panel de control' }}
            </p>
          </div>
        </div>
      </div>

      <nav class="flex-grow p-4">
        <ul class="space-y-2">
          <li v-for="item in menuItems" :key="item.to">
            <NuxtLink :to="item.to" class="nav-item" active-class="nav-item-active">
              <component :is="item.icon" class="h-5 w-5" />
              <span>{{ item.label }}</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <div class="space-y-4 border-t border-oscuro-700 p-4">
        <NuxtLink
          to="/"
          class="flex items-center gap-3 text-sm text-oscuro-200 transition hover:text-white"
        >
          <ExternalLink class="h-4 w-4" />
          <span>Volver al sitio principal</span>
        </NuxtLink>
        <div class="flex items-center justify-between">
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-white">
              {{ auth.user?.fullName ?? 'Administrador' }}
            </p>
            <p class="truncate text-xs text-oscuro-400">
              {{ auth.user?.email }}
            </p>
          </div>
          <button
            class="flex h-9 w-9 items-center justify-center rounded-lg text-oscuro-300 transition hover:bg-red-500/10 hover:text-red-500"
            title="Cerrar sesión"
            @click="auth.logout()"
          >
            <Power class="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Contenido -->
    <div class="min-h-screen pb-20 lg:ml-64 lg:pb-0">
      <header
        class="sticky top-0 z-30 border-b border-oscuro-700 bg-oscuro-800/80 px-4 py-4 backdrop-blur-sm sm:px-6 lg:px-8"
      >
        <h2 class="text-lg font-bold text-white">{{ pageTitle }}</h2>
      </header>
      <main class="p-4 sm:p-6 lg:p-8">
        <slot />
      </main>
    </div>

    <!-- Bottom nav mobile -->
    <nav
      class="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-oscuro-700 bg-oscuro-900/95 backdrop-blur-lg lg:hidden"
    >
      <NuxtLink
        v-for="item in menuItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-1 flex-col items-center gap-1 py-3 text-oscuro-400"
        active-class="text-green-400"
      >
        <component :is="item.icon" class="h-5 w-5" />
        <span class="text-[10px] font-semibold">{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import {
  LayoutDashboard,
  CalendarRange,
  CalendarClock,
  Users,
  Trophy,
  ExternalLink,
  Power,
  Building2,
  GraduationCap,
  Layers,
  Plug,
} from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
const route = useRoute()

const adminMenuItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/facultades', label: 'Facultades', icon: GraduationCap },
  { to: '/admin/eventos', label: 'Eventos', icon: CalendarRange },
  { to: '/admin/disciplinas', label: 'Disciplinas', icon: Trophy },
  { to: '/admin/programacion', label: 'Programación', icon: CalendarClock },
  { to: '/admin/inscripciones', label: 'Equipos', icon: Users },
  { to: '/admin/grupos', label: 'Salones y ciclos', icon: Layers },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Building2 },
  { to: '/admin/integraciones', label: 'Integraciones', icon: Plug },
]

const refereeMenuItems = [
  { to: '/admin/disciplinas', label: 'Disciplinas', icon: Trophy },
]

const treasuryMenuItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/inscripciones', label: 'Equipos de pago', icon: Users },
  { to: '/admin/grupos', label: 'Salones y ciclos', icon: Layers },
]

const menuItems = computed(() => {
  if (auth.isReferee) return refereeMenuItems
  if (auth.isTreasurer) return treasuryMenuItems
  return adminMenuItems
})

const pageTitle = computed(() => {
  const current = menuItems.value.find((i) => route.path.startsWith(i.to))
  return current?.label ?? 'Administración'
})
</script>

<style scoped>
.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1.5rem;
  color: var(--color-oscuro-300);
  border-radius: 0.5rem;
  transition: all 0.2s ease-in-out;
  font-weight: 600;
  letter-spacing: 0.025em;
}

.nav-item:hover {
  color: white;
  background-color: var(--color-oscuro-800);
  transform: translateX(4px);
}

.nav-item-active {
  color: white;
  background: linear-gradient(
    90deg,
    rgba(34, 197, 94, 0.15) 0%,
    rgba(34, 197, 94, 0) 100%
  );
  box-shadow:
    inset 3px 0 0 0 rgba(34, 197, 94, 0.7),
    0 1px 15px rgba(34, 197, 94, 0.1);
}
</style>
