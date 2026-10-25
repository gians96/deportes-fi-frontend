<template>
  <form class="space-y-4" @submit.prevent="save(!!resubmit)">
    <p
      v-if="team.status === 'OBSERVED' && team.observation"
      class="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm text-orange-200"
    >
      <span class="font-semibold">Observación:</span> {{ team.observation }}
    </p>
    <p v-if="hint" class="rounded-lg bg-oscuro-900/60 px-3 py-2 text-xs text-oscuro-300">{{ hint }}</p>

    <div class="grid gap-4 sm:grid-cols-2">
      <label class="block">
        <span class="text-sm text-oscuro-200">Nombre del equipo</span>
        <input v-model="form.teamName" type="text" required class="input" />
      </label>
      <label class="block">
        <span class="text-sm text-oscuro-200">Celular de contacto</span>
        <input v-model="form.phone" type="tel" class="input" placeholder="999 999 999" />
      </label>
      <label v-if="adminMode && delegates.length" class="block" :class="showCycleSection ? '' : 'sm:col-span-2'">
        <span class="text-sm text-oscuro-200">Delegado responsable</span>
        <select v-model.number="form.delegateId" class="input">
          <option v-for="user in delegates" :key="user.id" :value="user.id">
            {{ user.fullName }} · {{ user.email }}
          </option>
        </select>
      </label>
      <div v-if="showCycleSection" class="grid grid-cols-2 gap-3">
        <label class="block">
          <span class="text-sm text-oscuro-200">Ciclo</span>
          <input v-model="form.cycle" type="text" class="input" placeholder="Ej. VIII" />
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Sección</span>
          <input v-model="form.section" type="text" class="input" placeholder="Ej. A" />
        </label>
      </div>
    </div>

    <div>
      <p class="text-sm font-semibold text-green-300">
        Jugadores ({{ rows.length }})
        <span v-if="team.discipline" class="font-normal text-oscuro-300">
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
        <div class="flex gap-2">
          <button
            type="button"
            class="h-[46px] rounded-lg bg-green-500/15 px-5 font-semibold text-green-300 hover:bg-green-500/25 disabled:opacity-60"
            :disabled="roster.searching.value"
            @click="addPlayer"
          >
            {{ roster.searching.value ? 'Buscando…' : 'Agregar' }}
          </button>
          <button
            v-if="adminMode"
            type="button"
            class="h-[46px] rounded-lg bg-oscuro-700/60 px-4 text-sm font-semibold text-oscuro-100 hover:bg-oscuro-700"
            title="Agrega una fila vacía para escribir los datos a mano"
            @click="addBlankPlayer"
          >
            + En blanco
          </button>
        </div>
      </div>
      <p v-if="roster.searchError.value" class="mt-2 text-sm text-red-400">
        {{ roster.searchError.value }}
      </p>

      <ul class="mt-3 space-y-2">
        <li
          v-for="(player, index) in rows"
          :key="player.key"
          class="grid gap-2 rounded-xl border border-oscuro-800 bg-oscuro-900/60 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center"
        >
          <div class="min-w-0">
            <template v-if="adminMode">
              <div class="grid gap-2 sm:grid-cols-[1.4fr_1fr_1fr_auto]">
                <label class="block">
                  <span class="text-xs text-oscuro-300">Nombre completo</span>
                  <input v-model="player.fullName" type="text" class="input !mt-0 !py-1.5 text-sm uppercase" />
                </label>
                <label class="block">
                  <span class="text-xs text-oscuro-300">Código</span>
                  <input v-model="player.studentCode" type="text" class="input !mt-0 !py-1.5 text-sm" />
                </label>
                <label class="block">
                  <span class="text-xs text-oscuro-300">DNI</span>
                  <input
                    v-model="player.dni"
                    type="text"
                    inputmode="numeric"
                    maxlength="8"
                    class="input !mt-0 !py-1.5 text-sm"
                    placeholder="8 dígitos"
                  />
                </label>
                <label class="block">
                  <span class="text-xs text-oscuro-300">Género</span>
                  <select v-model="player.gender" class="input !mt-0 !py-1.5 text-sm">
                    <option value="M">Varón</option>
                    <option value="F">Mujer</option>
                    <option value="O">No indica</option>
                  </select>
                </label>
              </div>
              <label v-if="team.groupId" class="mt-2 flex items-center gap-1.5 text-xs text-oscuro-200">
                <input
                  type="radio"
                  name="team-captain"
                  :checked="player.isCaptain === true"
                  @change="setCaptain(index)"
                />
                Capitán/a
              </label>
            </template>
            <template v-else>
              <p class="truncate font-bold uppercase text-white">{{ player.fullName }}</p>
              <div class="mt-1 flex flex-wrap items-center gap-3 text-xs text-oscuro-300">
                <span>{{ player.studentCode || 'Sin código' }}</span>
                <label class="flex items-center gap-1.5 text-oscuro-200">
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
                    name="team-captain"
                    :checked="player.isCaptain === true"
                    @change="setCaptain(index)"
                  />
                  Capitán/a
                </label>
              </div>
            </template>
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
      <p v-if="!rows.length" class="mt-2 text-sm text-oscuro-300">
        El equipo no tiene jugadores.
      </p>
    </div>

    <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

    <div class="flex flex-wrap justify-end gap-3">
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-semibold text-oscuro-200 hover:bg-oscuro-700"
        @click="emit('cancel')"
      >
        Cancelar
      </button>
      <button
        v-if="resubmit"
        type="button"
        class="rounded-lg bg-oscuro-700/70 px-4 py-2 text-sm font-semibold text-oscuro-100 hover:bg-oscuro-700 disabled:opacity-60"
        :disabled="saving"
        @click="save(false)"
      >
        Guardar sin reenviar
      </button>
      <button
        type="submit"
        class="rounded-lg bg-green-500 px-5 py-2 text-sm font-semibold text-oscuro-900 hover:bg-green-400 disabled:opacity-60"
        :disabled="saving"
      >
        {{ saving ? 'Guardando…' : resubmit ? 'Guardar y reenviar' : 'Guardar cambios' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { AuthUser, Participant, Team } from '~/types/domain'
import { apiMessage } from '~/utils/groups'

/**
 * Edición de un equipo, dentro del mismo modal de revisión (no abre otro modal). La usan:
 * - Owner y Administrador (`adminMode`): nombre, celular, delegado, ciclo y sección (equipos fuera de un salón) y
 *   cada jugador (nombre, código, DNI, género, capitán), en cualquier estado menos cancelado.
 * - El delegado de un equipo observado (`resubmit`): nombre, celular y nómina; «Guardar y reenviar» lo devuelve a
 *   revisión (`POST /registrations/:id/submit`).
 * Las reglas las valida el servidor; aquí solo se muestran sus mensajes.
 */
type DelegateOption = Pick<AuthUser, 'id' | 'fullName' | 'email'>
type Row = Participant & { key: number }

const props = defineProps<{
  team: Team
  adminMode?: boolean
  /** El delegado corrige un equipo observado: se ofrece reenviarlo al guardar. */
  resubmit?: boolean
  /** Candidatos a delegado (solo `adminMode`). */
  delegateOptions?: DelegateOption[]
}>()
const emit = defineEmits<{ saved: [resubmitted: boolean]; refresh: []; cancel: [] }>()

const api = useApi()
const roster = useRosterSearch()

const form = reactive({ teamName: '', phone: '', delegateId: 0, cycle: '', section: '' })
const rows = ref<Row[]>([])
const search = ref('')
const saving = ref(false)
const error = ref('')
let seq = 0

const mode = computed<'STUDENT' | 'OTHER'>(() => props.team.discipline?.participantType ?? 'STUDENT')

/** Ciclo y sección solo se editan en equipos sin salón o ciclo: en los demás los define el grupo. */
const showCycleSection = computed(() => !!props.adminMode && !props.team.groupId && mode.value === 'STUDENT')

const delegates = computed<DelegateOption[]>(() => {
  const list = [...(props.delegateOptions ?? [])]
  const current = props.team.delegate
  if (current && !list.some((user) => user.id === current.id)) {
    list.unshift({ id: current.id, fullName: current.fullName, email: current.email })
  }
  return list
})

const hint = computed(() => {
  if (props.adminMode) {
    return props.team.status === 'DRAFT'
      ? ''
      : 'Los cambios se validan con las reglas completas de la disciplina (mínimo y máximo de jugadores, capitán/a, DNI); un equipo aprobado sigue aprobado si las cumple y el pago no cambia.'
  }
  return props.resubmit
    ? 'Corrige lo observado y pulsa «Guardar y reenviar»: el equipo vuelve a revisión. Las reglas completas (mínimo de jugadores, capitán/a, DNI) se validan al reenviar.'
    : ''
})

// Cada vez que se entra a editar, el formulario parte de los datos actuales del equipo.
watch(
  () => props.team.id,
  () => {
    form.teamName = props.team.name
    form.phone = props.team.phone ?? ''
    form.delegateId = props.team.delegateId
    form.cycle = props.team.cycle ?? ''
    form.section = props.team.section ?? ''
    rows.value = props.team.participants.map((p) => ({
      key: ++seq,
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
  const hit = await roster.find(search.value, mode.value, rows.value)
  if (!hit) return
  rows.value.push({
    ...hit.participant,
    key: ++seq,
    ...(props.team.groupId ? { isCaptain: rows.value.length === 0 } : {}),
  })
  search.value = ''
}

/** Fila vacía para escribir a mano a una persona que el padrón no devuelve. */
function addBlankPlayer() {
  rows.value.push({
    key: ++seq,
    fullName: '',
    studentCode: null,
    dni: null,
    gender: 'O',
    isDelegate: false,
    countsAsPlayer: true,
    isCaptain: !!props.team.groupId && rows.value.length === 0,
  })
}

function setCaptain(index: number) {
  rows.value.forEach((p, i) => {
    p.isCaptain = i === index
  })
}

function removePlayer(index: number) {
  rows.value.splice(index, 1)
  if (props.team.groupId && rows.value.length && !rows.value.some((p) => p.isCaptain)) {
    setCaptain(0)
  }
}

async function save(send: boolean) {
  error.value = ''
  saving.value = true
  let patched = false
  try {
    const payload: Record<string, unknown> = {
      teamName: form.teamName,
      phone: form.phone,
      participants: rows.value.map((p) => ({
        fullName: p.fullName.trim(),
        studentCode: p.studentCode?.trim() || null,
        dni: p.dni?.trim() || null,
        gender: p.gender,
        isDelegate: false,
        countsAsPlayer: true,
        isCaptain: p.isCaptain === true,
      })),
    }
    if (props.adminMode) {
      if (form.delegateId && form.delegateId !== props.team.delegateId) payload.delegateId = form.delegateId
      if (showCycleSection.value) {
        payload.cycle = form.cycle.trim() || null
        payload.section = form.section.trim() || null
      }
    }
    await api.patch(`/registrations/${props.team.id}`, payload)
    patched = true
    if (send) await api.post(`/registrations/${props.team.id}/submit`)
    emit('saved', send)
  } catch (err) {
    const failure = send ? 'No se pudo reenviar el equipo.' : 'No se pudo guardar el equipo.'
    error.value = patched
      ? `Los cambios se guardaron, pero no se pudo reenviar: ${apiMessage(err, failure)}`
      : apiMessage(err, failure)
    // El guardado sí ocurrió: la lista se actualiza sin cerrar el editor para que se vea el motivo.
    if (patched) emit('refresh')
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
