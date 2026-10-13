<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-white">Consultas de DNI</h1>
        <p class="mt-1 max-w-3xl text-sm text-oscuro-300">
          Pool de tokens de Decolecta y API Perú que validan el DNI al completar el perfil y al inscribir
          integrantes. Se usan por prioridad (menor número primero); si uno se agota o falla, se pasa
          automáticamente al siguiente. Los nombres consultados se guardan 30 días para no gastar cupo.
          Todo se guarda en la plataforma y rige en la siguiente consulta, sin reiniciar nada.
        </p>
      </div>
      <button
        class="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-oscuro-900 hover:bg-green-400"
        @click="openForm()"
      >
        Agregar token
      </button>
    </header>

    <p v-if="loadError" class="text-sm text-red-400">{{ loadError }}</p>
    <p
      v-if="notice"
      class="rounded-lg px-4 py-2 text-sm"
      :class="notice.ok ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'"
    >
      {{ notice.text }}
    </p>

    <p
      v-if="encryptionKey === 'none'"
      class="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
    >
      El servidor no tiene una clave para cifrar tokens (ni <code>INTEGRATION_SECRET_KEY</code> ni
      <code>JWT_SECRET</code>): no se puede guardar ninguno.
    </p>
    <p
      v-else-if="encryptionKey === 'derived'"
      class="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200"
    >
      Los tokens se cifran con una clave derivada de <code>JWT_SECRET</code>. Para usar una clave propia define
      <code>INTEGRATION_SECRET_KEY</code>; cambiar cualquiera de las dos obliga a volver a ingresar los tokens.
    </p>

    <div class="grid gap-4 sm:grid-cols-3">
      <div class="rounded-xl border border-oscuro-700 bg-oscuro-850 p-5">
        <p class="text-sm text-oscuro-300">Tokens disponibles</p>
        <p class="mt-2 text-2xl font-bold" :class="availableCount ? 'text-green-300' : 'text-red-300'">
          {{ availableCount }} / {{ tokens.length }}
        </p>
      </div>
      <div class="rounded-xl border border-oscuro-700 bg-oscuro-850 p-5">
        <p class="text-sm text-oscuro-300">Consultas restantes</p>
        <p class="mt-2 text-2xl font-bold text-white">
          {{ hasUnlimited ? '∞' : remaining.toLocaleString('es-PE') }}
        </p>
        <p class="mt-1 text-xs text-oscuro-400">Suma de los tokens disponibles con límite</p>
      </div>
      <div class="rounded-xl border border-oscuro-700 bg-oscuro-850 p-5">
        <p class="text-sm text-oscuro-300">Consultas (últimos 30 días)</p>
        <p class="mt-2 text-2xl font-bold text-sky-300">{{ totalUsage.toLocaleString('es-PE') }}</p>
        <p class="mt-1 text-xs text-oscuro-400">Incluye las que salieron de la caché</p>
      </div>
    </div>

    <p
      v-if="!loading && !availableCount"
      class="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200"
      role="alert"
    >
      No hay tokens disponibles: la validación de DNI responderá que el servicio no está disponible hasta que
      agregues uno, reinicies uno agotado o reemplaces uno rechazado.
    </p>

    <section class="overflow-x-auto rounded-xl border border-oscuro-700">
      <table class="w-full text-left text-sm">
        <thead class="bg-oscuro-800 text-oscuro-300">
          <tr>
            <th class="px-4 py-3">Prioridad</th>
            <th class="px-4 py-3">Token</th>
            <th class="px-4 py-3">Uso</th>
            <th class="px-4 py-3">Renovación</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-oscuro-700 bg-oscuro-850">
          <tr v-for="token in tokens" :key="token.id" :class="{ 'opacity-60': !token.enabled }">
            <td class="px-4 py-3 text-center font-mono text-white">{{ token.priority }}</td>
            <td class="px-4 py-3">
              <p class="font-semibold text-white">{{ token.name }}</p>
              <p class="text-xs text-oscuro-300">
                {{ token.providerLabel }} · <span class="font-mono">{{ token.tokenMask }}</span>
              </p>
              <p v-if="token.customUrl" class="text-xs text-oscuro-400">URL propia: {{ token.apiUrl }}</p>
              <p
                v-if="token.lastError"
                class="mt-0.5 max-w-xs truncate text-xs text-red-300"
                :title="token.lastError"
              >
                {{ token.lastError }}
              </p>
            </td>
            <td class="min-w-44 px-4 py-3">
              <p class="tabular-nums text-white">
                {{ token.queriesUsed.toLocaleString('es-PE') }}
                <span class="text-oscuro-400">
                  / {{ token.queryLimit === null ? '∞' : token.queryLimit.toLocaleString('es-PE') }}
                </span>
              </p>
              <div
                v-if="token.usagePercent !== null"
                class="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-oscuro-700"
                role="progressbar"
                :aria-valuenow="token.usagePercent"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  class="h-full rounded-full"
                  :class="
                    token.usagePercent >= 90
                      ? 'bg-red-400'
                      : token.usagePercent >= 70
                        ? 'bg-yellow-400'
                        : 'bg-green-400'
                  "
                  :style="{ width: token.usagePercent + '%' }"
                />
              </div>
              <p class="mt-0.5 whitespace-nowrap text-xs text-oscuro-400">
                Último uso: {{ token.lastUsedAt ? formatDateTime(token.lastUsedAt) : 'nunca' }}
              </p>
            </td>
            <td class="px-4 py-3">
              <p class="text-white">{{ PERIODS[token.renewalPeriod] }}</p>
              <p class="whitespace-nowrap text-xs text-oscuro-400">
                {{ token.renewsAt ? formatDateTime(token.renewsAt) : 'Sin fecha' }}
              </p>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-col items-start gap-1">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="STATE_STYLES[token.state].class"
                >
                  {{ STATE_STYLES[token.state].label }}
                </span>
                <span
                  v-if="!token.enabled"
                  class="rounded-full bg-oscuro-700 px-2.5 py-1 text-xs font-semibold text-oscuro-300"
                >
                  Pausado
                </span>
              </div>
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-right">
              <button class="action text-sky-300" @click="openTest(token)">Probar</button>
              <button class="action text-oscuro-200" @click="askReset(token)">Reiniciar</button>
              <button class="action text-oscuro-200" @click="toggleEnabled(token)">
                {{ token.enabled ? 'Pausar' : 'Activar' }}
              </button>
              <button class="action text-sky-300" @click="openForm(token)">Editar</button>
              <button class="action text-red-400" @click="askRemove(token)">Eliminar</button>
            </td>
          </tr>
          <tr v-if="!loading && !tokens.length">
            <td colspan="6" class="px-4 py-10 text-center text-oscuro-300">
              Agrega tu primer token de Decolecta o API Perú.
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <div class="grid gap-6 xl:grid-cols-5">
      <section class="rounded-xl border border-oscuro-700 bg-oscuro-850 p-5 xl:col-span-3">
        <h2 class="text-sm font-semibold text-oscuro-200">Consultas por día</h2>
        <p class="mb-4 text-xs text-oscuro-400">Últimos 30 días, por resultado (hora de Lima)</p>
        <DniUsageChart v-if="chart.labels.length" :labels="chart.labels" :series="chart.series" />
        <p v-else class="py-10 text-center text-sm text-oscuro-400">Sin consultas registradas.</p>
      </section>

      <section class="rounded-xl border border-oscuro-700 bg-oscuro-850 p-5 xl:col-span-2">
        <h2 class="text-sm font-semibold text-oscuro-200">Consulta manual</h2>
        <p class="mb-4 text-xs text-oscuro-400">Consulta un DNI con el pool (usa la caché si existe).</p>
        <form class="flex gap-2" @submit.prevent="manualLookup">
          <label for="dni-manual" class="sr-only">DNI</label>
          <input
            id="dni-manual"
            v-model.trim="manual.dni"
            inputmode="numeric"
            maxlength="8"
            placeholder="12345678"
            class="input !mt-0 font-mono"
          />
          <button
            type="submit"
            class="shrink-0 rounded-lg bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300 hover:bg-green-500/20 disabled:opacity-50"
            :disabled="manual.busy || !isDni(manual.dni)"
          >
            {{ manual.busy ? 'Consultando…' : 'Consultar' }}
          </button>
        </form>
        <p v-if="manual.result" class="mt-3 rounded-lg bg-oscuro-900/70 px-4 py-3 text-sm text-white">
          {{ manual.result }}
        </p>
        <button
          class="mt-4 text-xs font-semibold text-red-300 hover:text-red-200"
          @click="clearCacheOpen = true"
        >
          Vaciar la caché de consultas
        </button>
      </section>
    </div>

    <section class="overflow-hidden rounded-xl border border-oscuro-700">
      <header class="flex items-center justify-between border-b border-oscuro-700 bg-oscuro-800 px-5 py-3">
        <div>
          <h2 class="text-sm font-semibold text-oscuro-200">Bitácora</h2>
          <p class="text-xs text-oscuro-400">Los DNI se guardan enmascarados.</p>
        </div>
        <button class="action text-oscuro-200" @click="refresh">Actualizar</button>
      </header>
      <div class="overflow-x-auto bg-oscuro-850">
        <table class="w-full text-left text-sm">
          <thead class="text-oscuro-300">
            <tr>
              <th class="px-4 py-2">Fecha</th>
              <th class="px-4 py-2">DNI</th>
              <th class="px-4 py-2">Origen</th>
              <th class="px-4 py-2">Token</th>
              <th class="px-4 py-2">Resultado</th>
              <th class="px-4 py-2 text-right">HTTP</th>
              <th class="px-4 py-2 text-right">ms</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-oscuro-700">
            <tr v-for="entry in logs" :key="entry.id">
              <td class="whitespace-nowrap px-4 py-2 text-xs text-oscuro-300">
                {{ formatDateTime(entry.createdAt) }}
              </td>
              <td class="px-4 py-2 font-mono text-white">{{ entry.dni }}</td>
              <td class="px-4 py-2 text-oscuro-300">{{ ORIGINS[entry.origin] }}</td>
              <td class="px-4 py-2 text-oscuro-300">
                {{ entry.token ?? (entry.result === 'CACHE' ? '—' : (entry.provider ?? '—')) }}
              </td>
              <td class="px-4 py-2">
                <span class="inline-flex items-center gap-1.5 text-white">
                  <span
                    class="h-2 w-2 rounded-full"
                    :style="{ background: RESULTS[entry.result].color }"
                    aria-hidden="true"
                  />
                  {{ RESULTS[entry.result].label }}
                </span>
                <p
                  v-if="entry.detail"
                  class="max-w-xs truncate text-xs text-oscuro-400"
                  :title="entry.detail"
                >
                  {{ entry.detail }}
                </p>
              </td>
              <td class="px-4 py-2 text-right tabular-nums text-oscuro-300">{{ entry.httpStatus ?? '—' }}</td>
              <td class="px-4 py-2 text-right tabular-nums text-oscuro-300">{{ entry.durationMs ?? '—' }}</td>
            </tr>
            <tr v-if="!logs.length">
              <td colspan="7" class="px-4 py-8 text-center text-oscuro-400">Sin registros.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <footer
        v-if="logMeta && logMeta.totalPages > 1"
        class="flex items-center justify-between border-t border-oscuro-700 bg-oscuro-800 px-5 py-2 text-xs text-oscuro-300"
      >
        <span>Página {{ logMeta.page }} de {{ logMeta.totalPages }} · {{ logMeta.total }} registros</span>
        <span class="flex gap-2">
          <button class="action" :disabled="logMeta.page <= 1" @click="loadLogs(logMeta.page - 1)">
            Anterior
          </button>
          <button
            class="action"
            :disabled="logMeta.page >= logMeta.totalPages"
            @click="loadLogs(logMeta.page + 1)"
          >
            Siguiente
          </button>
        </span>
      </footer>
    </section>

    <!-- Agregar / editar token -->
    <AppModal v-model="formOpen" :title="editing ? 'Editar token' : 'Agregar token'">
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="saveToken">
        <label class="block">
          <span class="text-sm text-oscuro-200">Proveedor</span>
          <select v-model="form.provider" class="input" :disabled="!!editing">
            <option v-for="info in providers" :key="info.provider" :value="info.provider">
              {{ info.label }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Alias</span>
          <input
            v-model="form.name"
            required
            maxlength="100"
            placeholder="Ej.: Decolecta cuenta congreso"
            class="input"
          />
        </label>
        <label class="block sm:col-span-2">
          <span class="text-sm text-oscuro-200">Token</span>
          <input
            v-model="form.token"
            type="password"
            autocomplete="off"
            :required="!editing"
            :placeholder="editing ? 'Déjalo vacío para conservar el actual' : 'Pega aquí el token del proveedor'"
            class="input font-mono"
          />
          <span class="mt-1 block text-xs text-oscuro-400">
            <template v-if="editing">Actual: {{ editing.tokenMask }}. </template>
            Se guarda cifrado y no se vuelve a mostrar.
            <template v-if="providerInfo"> Genéralo en {{ providerInfo.tokenHelpUrl }}.</template>
          </span>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Límite de consultas</span>
          <input v-model="form.queryLimit" type="number" min="1" class="input" />
          <span class="mt-1 block text-xs text-oscuro-400">Vacío = sin límite conocido.</span>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Consultas ya usadas</span>
          <input v-model.number="form.queriesUsed" type="number" min="0" class="input" />
          <span class="mt-1 block text-xs text-oscuro-400">Si el token ya tenía consumo en este periodo.</span>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Periodo de renovación</span>
          <select v-model="form.renewalPeriod" class="input">
            <option v-for="(label, value) in PERIODS" :key="value" :value="value">{{ label }}</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Próxima renovación</span>
          <input v-model="form.renewsAt" type="datetime-local" class="input" />
          <span class="mt-1 block text-xs text-oscuro-400">Fecha en que el proveedor reinicia tu cuota.</span>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Prioridad</span>
          <input v-model.number="form.priority" type="number" min="0" required class="input" />
          <span class="mt-1 block text-xs text-oscuro-400">Menor número = se usa primero.</span>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">URL del servicio (opcional)</span>
          <input
            v-model="form.apiUrl"
            :placeholder="providerInfo?.defaultUrl"
            class="input font-mono"
          />
          <span class="mt-1 block text-xs text-oscuro-400">Vacío = la URL oficial.</span>
        </label>
        <label class="flex items-center gap-2 sm:col-span-2">
          <input v-model="form.enabled" type="checkbox" class="h-4 w-4 accent-green-500" />
          <span class="text-sm text-oscuro-200">Activo (se usa en las consultas)</span>
        </label>
        <p v-if="modalError" class="text-sm text-red-400 sm:col-span-2">{{ modalError }}</p>
        <button
          type="submit"
          :disabled="saving"
          class="rounded-lg bg-green-500 px-5 py-2.5 font-semibold text-oscuro-900 hover:bg-green-400 disabled:opacity-60 sm:col-span-2"
        >
          {{ saving ? 'Guardando…' : 'Guardar' }}
        </button>
      </form>
    </AppModal>

    <!-- Probar un token -->
    <AppModal v-model="testOpen" :title="'Probar «' + (testTarget?.name ?? '') + '»'">
      <p class="text-sm text-oscuro-300">
        La prueba hace una consulta real al proveedor y consume una consulta del plan. No muestra datos de la
        persona.
      </p>
      <form class="mt-4 flex gap-2" @submit.prevent="runTest">
        <label for="dni-prueba" class="sr-only">DNI</label>
        <input
          id="dni-prueba"
          v-model.trim="test.dni"
          inputmode="numeric"
          maxlength="8"
          placeholder="DNI de 8 dígitos"
          class="input !mt-0 font-mono"
        />
        <button
          type="submit"
          class="shrink-0 rounded-lg bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/30 disabled:opacity-50"
          :disabled="test.busy || !isDni(test.dni)"
        >
          {{ test.busy ? 'Probando…' : 'Probar' }}
        </button>
      </form>
      <p
        v-if="test.result"
        class="mt-4 rounded-lg px-4 py-3 text-sm"
        :class="test.ok ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'"
      >
        {{ test.result }}
      </p>
    </AppModal>

    <AppConfirm
      v-model="resetOpen"
      title="Reiniciar token"
      :message="'El contador de «' + (actionTarget?.name ?? '') + '» volverá a 0 y quedará activo. Úsalo cuando el proveedor ya renovó tu plan o corregiste el problema.'"
      confirm-text="Reiniciar"
      :loading="actionBusy"
      :error="actionError"
      @confirm="runReset"
    />
    <UndcApiCard />

    <AppConfirm
      v-model="removeOpen"
      title="Eliminar token"
      :message="'¿Eliminar «' + (actionTarget?.name ?? '') + '»? Su historial de consultas se conserva sin el token.'"
      confirm-text="Eliminar"
      :loading="actionBusy"
      :error="actionError"
      @confirm="runRemove"
    />
    <AppConfirm
      v-model="clearCacheOpen"
      title="Vaciar la caché"
      message="Se borrarán los nombres guardados de las personas consultadas. Las próximas consultas volverán a gastar cupo del proveedor."
      confirm-text="Vaciar"
      :loading="actionBusy"
      :error="actionError"
      @confirm="runClearCache"
    />
  </div>
</template>

<script setup lang="ts">
import type {
  DniLogEntry,
  DniLogsResponse,
  DniLookupResult,
  DniManualLookup,
  DniProviderInfo,
  DniProviderName,
  DniToken,
  DniTokenState,
  DniTokenTestResult,
  DniTokensResponse,
  DniUsage,
  EncryptionKeySource,
  RenewalPeriod,
} from '~/types/domain'
import { formatDateTime, fromDateTimeLocalInput, toDateTimeLocalInput } from '~/utils/format'
import { apiMessage } from '~/utils/groups'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const api = useApi()

const PERIODS: Record<RenewalPeriod, string> = {
  MONTHLY: 'Mensual',
  DAILY: 'Diaria',
  YEARLY: 'Anual',
  NONE: 'No se renueva',
}

const STATE_STYLES: Record<DniTokenState, { label: string; class: string }> = {
  ACTIVE: { label: 'Activo', class: 'bg-green-500/10 text-green-300' },
  EXHAUSTED: { label: 'Agotado', class: 'bg-yellow-500/10 text-yellow-300' },
  INVALID: { label: 'Inválido', class: 'bg-red-500/10 text-red-300' },
}

const RESULTS: Record<DniLookupResult, { label: string; color: string }> = {
  SUCCESS: { label: 'Éxito', color: '#10b981' },
  CACHE: { label: 'Caché', color: '#00d9e8' },
  NOT_FOUND: { label: 'No encontrado', color: '#64748b' },
  EXHAUSTED: { label: 'Agotado', color: '#fbbf24' },
  INVALID_TOKEN: { label: 'Token inválido', color: '#ef4444' },
  ERROR: { label: 'Error', color: '#f97316' },
  NO_TOKENS: { label: 'Sin tokens', color: '#a855f7' },
}

const ORIGINS = {
  PROFILE: 'Perfil',
  ROSTER: 'Equipo',
  PANEL: 'Panel',
} as const

const isDni = (value: string) => /^\d{8}$/.test(value)

const tokens = ref<DniToken[]>([])
const providers = ref<DniProviderInfo[]>([])
const encryptionKey = ref<EncryptionKeySource>('derived')
const usage = ref<DniUsage | null>(null)
const logs = ref<DniLogEntry[]>([])
const logMeta = ref<DniLogsResponse['meta'] | null>(null)
const loading = ref(true)
const loadError = ref('')
const notice = ref<{ ok: boolean; text: string } | null>(null)

const availableCount = computed(() => tokens.value.filter((token) => token.available).length)
const hasUnlimited = computed(() =>
  tokens.value.some((token) => token.available && token.queryLimit === null),
)
const remaining = computed(() =>
  tokens.value
    .filter((token) => token.available)
    .reduce((sum, token) => sum + (token.queriesRemaining ?? 0), 0),
)
const totalUsage = computed(() =>
  (usage.value?.byDay ?? []).reduce(
    (sum, day) =>
      sum +
      Object.entries(day)
        .filter(([key]) => key !== 'date')
        .reduce((acc, [, value]) => acc + Number(value), 0),
    0,
  ),
)

// Barras apiladas: una serie por resultado que aparezca en la ventana.
const chart = computed(() => {
  const days = usage.value?.byDay ?? []
  const keys = (Object.keys(RESULTS) as DniLookupResult[]).filter((key) =>
    days.some((day) => Number(day[key] ?? 0) > 0),
  )
  return {
    labels: days.map((day) => day.date.slice(5).split('-').reverse().join('/')),
    series: keys.map((key) => ({
      label: RESULTS[key].label,
      data: days.map((day) => Number(day[key] ?? 0)),
      color: RESULTS[key].color,
    })),
  }
})

async function loadTokens() {
  try {
    const data = await api.get<DniTokensResponse>('/settings/dni-tokens')
    tokens.value = data.tokens
    providers.value = data.providers
    encryptionKey.value = data.encryptionKey
    loadError.value = ''
  } catch (err) {
    loadError.value = apiMessage(err, 'No se pudo cargar la configuración de DNI.')
  } finally {
    loading.value = false
  }
}

async function loadUsage() {
  try {
    usage.value = await api.get<DniUsage>('/settings/dni-tokens/usage', { days: 30 })
  } catch {
    usage.value = null
  }
}

async function loadLogs(page = 1) {
  try {
    const data = await api.get<DniLogsResponse>('/settings/dni-tokens/logs', { page })
    logs.value = data.data
    logMeta.value = data.meta
  } catch {
    logs.value = []
    logMeta.value = null
  }
}

async function refresh() {
  await Promise.all([loadTokens(), loadUsage(), loadLogs(logMeta.value?.page ?? 1)])
}

function say(ok: boolean, text: string) {
  notice.value = { ok, text }
}

// --- Agregar / editar ---
interface TokenForm {
  provider: DniProviderName
  name: string
  // El token solo vive en este campo mientras se envía; nunca se guarda en el navegador.
  token: string
  apiUrl: string
  queryLimit: string | number
  queriesUsed: number
  renewalPeriod: RenewalPeriod
  renewsAt: string
  priority: number
  enabled: boolean
}

const formOpen = ref(false)
const editing = ref<DniToken | null>(null)
const saving = ref(false)
const modalError = ref('')
const form = reactive<TokenForm>({
  provider: 'DECOLECTA',
  name: '',
  token: '',
  apiUrl: '',
  queryLimit: '',
  queriesUsed: 0,
  renewalPeriod: 'MONTHLY',
  renewsAt: '',
  priority: 10,
  enabled: true,
})
const providerInfo = computed(() => providers.value.find((info) => info.provider === form.provider))

function openForm(token?: DniToken) {
  editing.value = token ?? null
  modalError.value = ''
  Object.assign(form, {
    provider: token?.provider ?? 'DECOLECTA',
    name: token?.name ?? '',
    token: '',
    apiUrl: token?.customUrl ? token.apiUrl : '',
    queryLimit: token?.queryLimit ?? '',
    queriesUsed: token?.queriesUsed ?? 0,
    renewalPeriod: token?.renewalPeriod ?? 'MONTHLY',
    renewsAt: token?.renewsAt ? toDateTimeLocalInput(token.renewsAt) : '',
    priority: token?.priority ?? (Math.max(0, ...tokens.value.map((item) => item.priority)) + 10),
    enabled: token?.enabled ?? true,
  })
  formOpen.value = true
}

async function saveToken() {
  modalError.value = ''
  if (!form.name.trim()) {
    modalError.value = 'Escribe un alias para el token.'
    return
  }
  if (!editing.value && form.token.trim().length < 8) {
    modalError.value = 'Pega el token del proveedor.'
    return
  }
  const body: Record<string, unknown> = {
    name: form.name.trim(),
    apiUrl: form.apiUrl.trim() || null,
    priority: Number(form.priority) || 0,
    enabled: form.enabled,
    queryLimit: form.queryLimit === '' || form.queryLimit === null ? null : Number(form.queryLimit),
    queriesUsed: Number(form.queriesUsed) || 0,
    renewalPeriod: form.renewalPeriod,
    renewsAt: form.renewsAt ? fromDateTimeLocalInput(form.renewsAt) : null,
  }
  if (!editing.value) body.provider = form.provider
  if (form.token.trim()) body.token = form.token.trim()

  saving.value = true
  try {
    if (editing.value) await api.patch(`/settings/dni-tokens/${editing.value.id}`, body)
    else await api.post('/settings/dni-tokens', body)
    form.token = ''
    formOpen.value = false
    say(true, 'Token guardado. El valor queda cifrado y no se volverá a mostrar.')
    await refresh()
  } catch (err) {
    modalError.value = apiMessage(err, 'No se pudo guardar el token.')
  } finally {
    saving.value = false
  }
}

async function toggleEnabled(token: DniToken) {
  try {
    await api.patch(`/settings/dni-tokens/${token.id}`, { enabled: !token.enabled })
    await loadTokens()
  } catch (err) {
    say(false, apiMessage(err, 'No se pudo cambiar el estado del token.'))
  }
}

// --- Probar ---
const testOpen = ref(false)
const testTarget = ref<DniToken | null>(null)
const test = reactive({ dni: '', busy: false, result: '', ok: false })

function openTest(token: DniToken) {
  testTarget.value = token
  Object.assign(test, { dni: '', busy: false, result: '', ok: false })
  testOpen.value = true
}

async function runTest() {
  if (!testTarget.value || !isDni(test.dni)) return
  test.busy = true
  test.result = ''
  try {
    const result = await api.post<DniTokenTestResult>(
      `/settings/dni-tokens/${testTarget.value.id}/test`,
      { dni: test.dni },
    )
    test.ok = result.ok
    test.result = result.message
    await refresh()
  } catch (err) {
    test.ok = false
    test.result = apiMessage(err, 'No se pudo probar el token.')
  } finally {
    test.busy = false
  }
}

// --- Reiniciar / eliminar / vaciar caché ---
const resetOpen = ref(false)
const removeOpen = ref(false)
const clearCacheOpen = ref(false)
const actionTarget = ref<DniToken | null>(null)
const actionBusy = ref(false)
const actionError = ref('')

function askReset(token: DniToken) {
  actionTarget.value = token
  actionError.value = ''
  resetOpen.value = true
}

function askRemove(token: DniToken) {
  actionTarget.value = token
  actionError.value = ''
  removeOpen.value = true
}

async function runAction(action: () => Promise<void>, close: () => void, fallback: string) {
  actionBusy.value = true
  actionError.value = ''
  try {
    await action()
    close()
    await refresh()
  } catch (err) {
    actionError.value = apiMessage(err, fallback)
  } finally {
    actionBusy.value = false
  }
}

function runReset() {
  const token = actionTarget.value
  if (!token) return
  return runAction(
    async () => {
      await api.post(`/settings/dni-tokens/${token.id}/reset`)
      say(true, `«${token.name}» quedó activo con el contador en 0.`)
    },
    () => (resetOpen.value = false),
    'No se pudo reiniciar el token.',
  )
}

function runRemove() {
  const token = actionTarget.value
  if (!token) return
  return runAction(
    async () => {
      await api.del(`/settings/dni-tokens/${token.id}`)
      say(true, `«${token.name}» se eliminó.`)
    },
    () => (removeOpen.value = false),
    'No se pudo eliminar el token.',
  )
}

function runClearCache() {
  return runAction(
    async () => {
      const result = await api.del<{ deleted: number }>('/settings/dni-tokens/cache')
      say(true, `Caché vaciada (${result?.deleted ?? 0} entradas).`)
    },
    () => (clearCacheOpen.value = false),
    'No se pudo vaciar la caché.',
  )
}

// --- Consulta manual ---
const manual = reactive({ dni: '', busy: false, result: '' })

async function manualLookup() {
  if (!isDni(manual.dni)) return
  manual.busy = true
  manual.result = ''
  try {
    const result = await api.post<DniManualLookup>('/settings/dni-tokens/lookup', { dni: manual.dni })
    const via = result.source === 'CACHE' ? 'desde la caché' : `vía ${result.provider}`
    manual.result = result.found
      ? `${result.fullName} · ${via}`
      : 'Ningún proveedor encontró ese DNI.'
    await refresh()
  } catch (err) {
    manual.result = apiMessage(err, 'No se pudo consultar el DNI.')
  } finally {
    manual.busy = false
  }
}

onMounted(refresh)
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
.input:disabled {
  opacity: 0.6;
}
.action {
  border-radius: 0.5rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}
.action:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.06);
}
.action:disabled {
  opacity: 0.4;
}
</style>
