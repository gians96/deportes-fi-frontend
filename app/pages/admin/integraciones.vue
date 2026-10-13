<template>
  <div class="mx-auto max-w-4xl">
    <h1 class="text-xl font-bold text-white">Proveedores de DNI</h1>
    <p class="mt-1 text-sm text-oscuro-300">
      Validan el DNI de los usuarios externos al completar su perfil y de los integrantes de las
      disciplinas para otros participantes. Se consultan por prioridad; si uno falla se prueba el
      siguiente. Todo se guarda en la plataforma y los cambios rigen en la siguiente consulta, sin
      reiniciar nada.
    </p>

    <p v-if="loading" class="mt-6 text-sm text-oscuro-400">Cargando…</p>
    <p v-else-if="loadError" class="mt-6 text-sm text-red-400">{{ loadError }}</p>

    <template v-else>
      <div
        v-if="encryptionKey === 'none'"
        class="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
      >
        El servidor no tiene una clave para cifrar los tokens, así que no se pueden guardar. Define
        <code>INTEGRATION_SECRET_KEY</code> (o <code>JWT_SECRET</code>) en el servidor.
      </div>
      <div
        v-else-if="encryptionKey === 'derived'"
        class="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200"
      >
        Los tokens se cifran con una clave derivada de <code>JWT_SECRET</code>. Para usar una clave
        propia define <code>INTEGRATION_SECRET_KEY</code>; cambiar cualquiera de las dos obliga a
        volver a ingresar los tokens.
      </div>

      <section
        v-for="provider in providers"
        :key="provider.provider"
        class="mt-5 rounded-2xl border border-oscuro-700 bg-oscuro-850 p-5"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-white">{{ provider.label }}</h2>
            <p class="mt-0.5 text-xs text-oscuro-400">
              Se consulta en el puesto {{ provider.priority + 1 }} (prioridad {{ provider.priority }})
            </p>
          </div>
          <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="stateClass(provider)">
            {{ stateLabel(provider) }}
          </span>
        </div>

        <dl class="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt class="text-xs text-oscuro-400">Token guardado</dt>
            <dd class="font-mono text-white">{{ provider.tokenMask ?? 'Sin token' }}</dd>
          </div>
          <div>
            <dt class="text-xs text-oscuro-400">Última consulta</dt>
            <dd class="text-white">
              {{ provider.lastCheckedAt ? formatDateTime(provider.lastCheckedAt) : 'Nunca' }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-oscuro-400">Resultado</dt>
            <dd class="text-white">{{ errorLabel(provider.lastError) }}</dd>
          </div>
        </dl>

        <form class="mt-4 grid gap-4 sm:grid-cols-2" @submit.prevent="save(provider)">
          <label class="block sm:col-span-2">
            <span class="text-sm text-oscuro-200">
              {{ provider.configured ? 'Reemplazar el token' : 'Token' }}
            </span>
            <input
              v-model="forms[provider.provider].token"
              type="password"
              autocomplete="off"
              class="input"
              :placeholder="
                provider.configured
                  ? 'Déjalo vacío para conservar el actual'
                  : 'Pega aquí el token del proveedor'
              "
            />
          </label>
          <label class="block sm:col-span-2">
            <span class="text-sm text-oscuro-200">URL del servicio</span>
            <input
              v-model="forms[provider.provider].apiUrl"
              type="text"
              class="input"
              :placeholder="provider.defaultUrl"
            />
            <span class="mt-1 block text-xs text-oscuro-400">
              Vacío = la URL oficial ({{ provider.defaultUrl }}).
            </span>
          </label>
          <label class="block">
            <span class="text-sm text-oscuro-200">Prioridad (0 = primero)</span>
            <input
              v-model.number="forms[provider.provider].priority"
              type="number"
              min="0"
              max="100"
              class="input"
            />
          </label>
          <label class="flex items-center gap-3 sm:pt-6">
            <input
              v-model="forms[provider.provider].enabled"
              type="checkbox"
              class="h-4 w-4 accent-green-500"
            />
            <span class="text-sm text-oscuro-200">Activo (se usa en las consultas)</span>
          </label>

          <p v-if="messages[provider.provider]" class="text-sm sm:col-span-2" :class="messageClass(provider)">
            {{ messages[provider.provider]?.text }}
          </p>

          <div class="flex flex-wrap gap-2 sm:col-span-2">
            <button
              type="submit"
              class="rounded-lg bg-green-500 px-5 py-2.5 font-semibold text-oscuro-900 transition hover:bg-green-400 disabled:opacity-60"
              :disabled="busy[provider.provider]"
            >
              {{ busy[provider.provider] ? 'Guardando…' : 'Guardar cambios' }}
            </button>
            <button
              v-if="provider.configured"
              type="button"
              class="rounded-lg bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/25 disabled:opacity-60"
              :disabled="busy[provider.provider]"
              @click="askRemoveToken(provider)"
            >
              Quitar token
            </button>
          </div>
        </form>

        <div class="mt-5 border-t border-oscuro-700 pt-4">
          <h3 class="text-sm font-semibold text-oscuro-200">Probar con un DNI</h3>
          <p class="mt-0.5 text-xs text-oscuro-400">
            Hace una consulta real con el token guardado (consume una consulta de tu plan) y solo
            muestra si el proveedor respondió, sin datos de la persona.
          </p>
          <div class="mt-2 flex flex-wrap items-start gap-2">
            <input
              v-model="testDni[provider.provider]"
              type="text"
              inputmode="numeric"
              maxlength="8"
              class="input !mt-0 w-40"
              placeholder="8 dígitos"
            />
            <button
              type="button"
              class="rounded-lg bg-sky-500/15 px-4 py-2.5 text-sm font-semibold text-sky-300 transition hover:bg-sky-500/25 disabled:opacity-60"
              :disabled="!provider.configured || testing[provider.provider]"
              @click="runTest(provider)"
            >
              {{ testing[provider.provider] ? 'Probando…' : 'Probar' }}
            </button>
          </div>
          <p
            v-if="testResults[provider.provider]"
            class="mt-2 text-sm"
            :class="testResults[provider.provider]?.ok ? 'text-green-400' : 'text-red-400'"
          >
            {{ testResults[provider.provider]?.message }}
          </p>
        </div>
      </section>
    </template>

    <AppConfirm
      v-model="removeOpen"
      title="Quitar el token"
      :message="`Se borrará el token guardado de ${removeTarget?.label ?? ''}. Dejará de usarse hasta que cargues uno nuevo.`"
      confirm-text="Quitar token"
      :loading="removeBusy"
      :error="removeError"
      @confirm="removeToken"
    />
  </div>
</template>

<script setup lang="ts">
import type {
  DniProviderConfig,
  DniProviderName,
  DniProviderTestResult,
  DniProvidersResponse,
  EncryptionKeySource,
} from '~/types/domain'
import { formatDateTime } from '~/utils/format'
import { apiMessage } from '~/utils/groups'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const api = useApi()

interface ProviderForm {
  token: string
  apiUrl: string
  priority: number
  enabled: boolean
}

const providers = ref<DniProviderConfig[]>([])
const encryptionKey = ref<EncryptionKeySource>('derived')
const loading = ref(true)
const loadError = ref('')

const forms = reactive({} as Record<DniProviderName, ProviderForm>)
const busy = reactive({} as Record<DniProviderName, boolean>)
const messages = reactive({} as Record<DniProviderName, { ok: boolean; text: string } | null>)
const testDni = reactive({} as Record<DniProviderName, string>)
const testing = reactive({} as Record<DniProviderName, boolean>)
const testResults = reactive({} as Record<DniProviderName, DniProviderTestResult | null>)

const removeOpen = ref(false)
const removeTarget = ref<DniProviderConfig | null>(null)
const removeBusy = ref(false)
const removeError = ref('')

const ERROR_LABELS: Record<string, string> = {
  UNAUTHORIZED_OR_LIMIT: 'Token inválido o límite de consultas agotado',
  RATE_LIMITED: 'Límite de consultas alcanzado',
  UNAVAILABLE: 'El servicio no respondió',
}

function errorLabel(code: string | null) {
  return code ? (ERROR_LABELS[code] ?? code) : '—'
}

function stateLabel(provider: DniProviderConfig) {
  if (!provider.configured) return 'Sin token'
  if (!provider.enabled) return 'Desactivado'
  return { VALID: 'Funcionando', INVALID: 'Token rechazado', UNVERIFIED: 'Sin verificar' }[
    provider.state
  ]
}

function stateClass(provider: DniProviderConfig) {
  if (!provider.configured || !provider.enabled) {
    return 'bg-oscuro-700 text-oscuro-300'
  }
  return {
    VALID: 'bg-green-500/10 text-green-300',
    INVALID: 'bg-red-500/10 text-red-300',
    UNVERIFIED: 'bg-yellow-500/10 text-yellow-300',
  }[provider.state]
}

function messageClass(provider: DniProviderConfig) {
  return messages[provider.provider]?.ok ? 'text-green-400' : 'text-red-400'
}

function syncForm(provider: DniProviderConfig) {
  forms[provider.provider] = {
    token: '',
    apiUrl: provider.customUrl ? provider.apiUrl : '',
    priority: provider.priority,
    enabled: provider.enabled,
  }
  busy[provider.provider] ??= false
  testing[provider.provider] ??= false
  testDni[provider.provider] ??= ''
  messages[provider.provider] ??= null
  testResults[provider.provider] ??= null
}

async function load() {
  try {
    const data = await api.get<DniProvidersResponse>('/settings/dni-providers')
    encryptionKey.value = data.encryptionKey
    providers.value = data.providers
    data.providers.forEach(syncForm)
    loadError.value = ''
  } catch (err) {
    loadError.value = apiMessage(err, 'No se pudo cargar la configuración.')
  } finally {
    loading.value = false
  }
}

async function save(provider: DniProviderConfig) {
  const form = forms[provider.provider]
  const body: Record<string, unknown> = {
    enabled: form.enabled,
    priority: Number.isFinite(form.priority) ? form.priority : provider.priority,
  }
  if (form.token.trim()) body.token = form.token.trim()
  const originalUrl = provider.customUrl ? provider.apiUrl : ''
  if (form.apiUrl.trim() !== originalUrl) body.apiUrl = form.apiUrl.trim()

  busy[provider.provider] = true
  messages[provider.provider] = null
  testResults[provider.provider] = null
  try {
    await api.put(`/settings/dni-providers/${provider.provider}`, body)
    await load()
    messages[provider.provider] = {
      ok: true,
      text: body.token ? 'Guardado. El nuevo token ya se usa en las consultas.' : 'Cambios guardados.',
    }
  } catch (err) {
    messages[provider.provider] = {
      ok: false,
      text: apiMessage(err, 'No se pudieron guardar los cambios.'),
    }
  } finally {
    busy[provider.provider] = false
  }
}

function askRemoveToken(provider: DniProviderConfig) {
  removeTarget.value = provider
  removeError.value = ''
  removeOpen.value = true
}

async function removeToken() {
  const target = removeTarget.value
  if (!target) return
  removeBusy.value = true
  removeError.value = ''
  try {
    await api.put(`/settings/dni-providers/${target.provider}`, { token: null })
    removeOpen.value = false
    testResults[target.provider] = null
    await load()
    messages[target.provider] = { ok: true, text: 'Token eliminado.' }
  } catch (err) {
    removeError.value = apiMessage(err, 'No se pudo quitar el token.')
  } finally {
    removeBusy.value = false
  }
}

async function runTest(provider: DniProviderConfig) {
  const dni = testDni[provider.provider]?.trim() ?? ''
  if (!/^\d{8}$/.test(dni)) {
    testResults[provider.provider] = { ok: false, result: 'invalid', message: 'Ingresa un DNI de 8 dígitos.' }
    return
  }
  testing[provider.provider] = true
  testResults[provider.provider] = null
  messages[provider.provider] = null
  try {
    testResults[provider.provider] = await api.post<DniProviderTestResult>(
      `/settings/dni-providers/${provider.provider}/test`,
      { dni },
    )
    await load()
  } catch (err) {
    testResults[provider.provider] = {
      ok: false,
      result: 'error',
      message: apiMessage(err, 'No se pudo probar el proveedor.'),
    }
  } finally {
    testing[provider.provider] = false
  }
}

onMounted(load)
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
