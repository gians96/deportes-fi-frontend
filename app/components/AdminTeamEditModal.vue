<template>
  <AppModal
    :model-value="modelValue"
    :title="team ? `Editar equipo · ${team.name}` : 'Editar equipo'"
    size="2xl"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form v-if="team" class="space-y-4" @submit.prevent="save">
      <p class="rounded-lg bg-oscuro-900/60 px-3 py-2 text-xs text-oscuro-300">
        Estado actual: <strong class="text-white">{{ statusLabel }}</strong>.
        <template v-if="team.status !== 'DRAFT'">
          Los cambios se validan con las reglas completas de la disciplina (mínimo y máximo de jugadores,
          capitán/a, DNI); un equipo aprobado sigue aprobado si las cumple.
        </template>
      </p>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm text-oscuro-200">Nombre del equipo</span>
          <input v-model="form.teamName" type="text" required class="input" />
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Celular de contacto</span>
          <input v-model="form.phone" type="tel" class="input" placeholder="999 999 999" />
        </label>
      </div>

      <div>
        <p class="text-sm font-semibold text-green-300">
          Jugadores ({{ form.participants.length }})
          <span v-if="team.discipline" class="font-normal text-oscuro-400">
            · se permiten {{ team.discipline.minPlayers }}-{{ team.discipline.maxPlayers }}
          </span>
        </p>

        <div class="mt-2 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label>
            <span class="text-xs text-oscuro-300">
              {{ mode === 'OTHER' ? 'Agregar por DNI' : 'Agregar por código de estudiante' }}
            </span>
            <input
              v-model="search"
              type="text"
              class="input"
              :inputmode="mode === 'OTHER' ? 'numeric' : 'text'"
              :placeholder="mode === 'OTHER' ? 'Ej. 71234567' : 'Ej. 2301010149'"
              @keydown.enter.prevent="addPlayer"
            />
          </label>
          <button
            type="button"
            class="h-[46px] rounded-lg bg-green-500/15 px-5 font-semibold text-green-300 hover:bg-green-500/25 disabled:opacity-60"
            :disabled="roster.searching.value"
            @click="addPlayer"
          >
            {{ roster.searching.value ? 'Buscando…' : 'Agregar' }}
          </button>
        </div>
        <p v-if="roster.searchError.value" class="mt-2 text-sm text-red-400">
          {{ roster.searchError.value }}
        </p>

        <ul class="mt-3 space-y-2">
          <li
            v-for="(player, index) in form.participants"
            :key="player.studentCode || player.dni || player.fullName"
            class="grid gap-2 rounded-xl border border-oscuro-800 bg-oscuro-900/60 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center"
          >
            <div class="min-w-0">
              <p class="truncate font-bold uppercase text-white">{{ player.fullName }}</p>
              <div class="mt-1 flex flex-wrap items-center gap-3 text-xs text-oscuro-400">
                <span>{{ player.studentCode || 'Sin código' }}</span>
                <label class="flex items-center gap-1.5 text-oscuro-300">
                  DNI
                  <input
                    v-model="player.dni"
                    type="text"
                    inputmode="numeric"
                    maxlength="8"
                    class="input !mt-0 w-28 !py-1 text-sm"
                    placeholder="8 dígitos"
                  />
                </label>
                <label v-if="team.groupId" class="flex items-center gap-1.5 text-oscuro-200">
                  <input
                    type="radio"
                    name="admin-captain"
                    :checked="player.isCaptain === true"
                    @change="setCaptain(index)"
                  />
                  Capitán/a
                </label>
              </div>
            </div>
            <button
              type="button"
              class="text-xs text-red-400 hover:text-red-300 md:justify-self-end"
              @click="removePlayer(index)"
            >
              Quitar
            </button>
          </li>
        </ul>
        <p v-if="!form.participants.length" class="mt-2 text-sm text-oscuro-400">
          El equipo no tiene jugadores.
        </p>
      </div>

      <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-semibold text-oscuro-200 hover:bg-oscuro-700"
          @click="emit('update:modelValue', false)"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="rounded-lg bg-green-500 px-5 py-2 text-sm font-semibold text-oscuro-900 hover:bg-green-400 disabled:opacity-60"
          :disabled="saving"
        >
          {{ saving ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </div>
    </form>
  </AppModal>
</template>

<script setup lang="ts">
import type { Participant, Team } from '~/types/domain'
import { apiMessage } from '~/utils/groups'

/**
 * Edición de un equipo por Owner o Administrador: nombre, celular y nómina (agregar o quitar jugadores,
 * cambiar capitán). Las reglas las valida el servidor; aquí solo se muestran sus mensajes.
 */
const props = defineProps<{ modelValue: boolean; team: Team | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; saved: [] }>()

const api = useApi()
const roster = useRosterSearch()

const form = reactive({ teamName: '', phone: '', participants: [] as Participant[] })
const search = ref('')
const saving = ref(false)
const error = ref('')

const mode = computed<'STUDENT' | 'OTHER'>(
  () => props.team?.discipline?.participantType ?? 'STUDENT',
)

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'borrador',
  PENDING: 'pendiente',
  APPROVED: 'aprobado',
  REJECTED: 'rechazado',
  CANCELLED: 'cancelado',
}
const statusLabel = computed(() => STATUS_LABELS[props.team?.status ?? ''] ?? props.team?.status ?? '')

// Cada vez que se abre, el formulario parte de los datos actuales del equipo.
watch(
  () => [props.modelValue, props.team?.id],
  () => {
    if (!props.modelValue || !props.team) return
    form.teamName = props.team.name
    form.phone = props.team.phone ?? ''
    form.participants = props.team.participants.map((p) => ({
      fullName: p.fullName,
      studentCode: p.studentCode ?? null,
      dni: p.dni ?? null,
      gender: p.gender ?? 'O',
      isDelegate: false,
      countsAsPlayer: true,
      isCaptain: p.isCaptain === true,
    }))
    search.value = ''
    error.value = ''
    roster.searchError.value = ''
  },
  { immediate: true },
)

async function addPlayer() {
  const hit = await roster.find(search.value, mode.value, form.participants)
  if (!hit) return
  form.participants.push({
    ...hit.participant,
    ...(props.team?.groupId ? { isCaptain: form.participants.length === 0 } : {}),
  })
  search.value = ''
}

function setCaptain(index: number) {
  form.participants.forEach((p, i) => {
    p.isCaptain = i === index
  })
}

function removePlayer(index: number) {
  form.participants.splice(index, 1)
  if (props.team?.groupId && form.participants.length && !form.participants.some((p) => p.isCaptain)) {
    setCaptain(0)
  }
}

async function save() {
  if (!props.team) return
  error.value = ''
  saving.value = true
  try {
    await api.patch(`/registrations/${props.team.id}`, {
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
    })
    emit('saved')
    emit('update:modelValue', false)
  } catch (err) {
    error.value = apiMessage(err, 'No se pudo guardar el equipo.')
  } finally {
    saving.value = false
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
