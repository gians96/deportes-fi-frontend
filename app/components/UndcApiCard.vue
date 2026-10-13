<template>
  <section class="rounded-xl border border-oscuro-700 bg-oscuro-850 p-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h2 class="text-base font-bold text-white">Padrón de estudiantes (API UNDC / JP)</h2>
        <p class="mt-1 max-w-3xl text-sm text-oscuro-300">
          Al buscar a un alumno por código se consulta primero a API UNDC, que devuelve también su DNI para que no
          haya que escribirlo. Si no está conectada, falla o no tiene el dato, se usa la búsqueda pública de
          SIVIRENO y el DNI se escribe a mano.
        </p>
      </div>
      <div class="flex shrink-0 flex-wrap gap-2">
        <button
          v-if="config?.configured"
          type="button"
          class="rounded-lg bg-oscuro-700/60 px-3 py-2 text-sm font-semibold text-oscuro-100 hover:bg-oscuro-700 disabled:opacity-60"
          :disabled="testing"
          @click="runTest"
        >
          {{ testing ? 'Probando…' : 'Probar' }}
        </button>
        <button
          type="button"
          class="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-oscuro-900 hover:bg-green-400"
          @click="openForm"
        >
          {{ config?.configured ? 'Editar conexión' : 'Conectar' }}
        </button>
      </div>
    </div>

    <p v-if="loadError" class="mt-3 text-sm text-red-400">{{ loadError }}</p>
    <p
      v-if="notice"
      class="mt-3 rounded-lg px-4 py-2 text-sm"
      :class="notice.ok ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'"
    >
      {{ notice.text }}
    </p>

    <p v-if="loading" class="mt-4 text-sm text-oscuro-400">Cargando…</p>
    <p
      v-else-if="config && !config.configured"
      class="mt-4 rounded-lg bg-oscuro-900/60 px-4 py-3 text-sm text-oscuro-300"
    >
      Sin conexión: el DNI de los alumnos se escribe a mano. Para activarla necesitas la URL de API UNDC y una API
      key con el permiso <code>estudiantes:consultar</code> (SIGENET → Clientes API).
    </p>
    <dl v-else-if="config" class="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <dt class="text-xs text-oscuro-400">URL</dt>
        <dd class="break-all font-mono text-white">{{ config.baseUrl }}</dd>
      </div>
      <div>
        <dt class="text-xs text-oscuro-400">API key</dt>
        <dd class="font-mono text-white">{{ config.keyMask }}</dd>
      </div>
      <div>
        <dt class="text-xs text-oscuro-400">Estado</dt>
        <dd class="flex flex-wrap items-center gap-2">
          <span
            class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            :class="
              !config.enabled
                ? 'bg-oscuro-600/40 text-oscuro-200'
                : config.lastStatus === 'FAILED'
                  ? 'bg-red-500/10 text-red-300'
                  : config.lastStatus === 'OK'
                    ? 'bg-green-500/10 text-green-300'
                    : 'bg-yellow-500/10 text-yellow-300'
            "
          >
            {{
              !config.enabled
                ? 'Desactivada'
                : config.lastStatus === 'FAILED'
                  ? 'Con errores'
                  : config.lastStatus === 'OK'
                    ? 'Funcionando'
                    : 'Sin probar'
            }}
          </span>
          <span v-if="config.lastCheckedAt" class="text-xs text-oscuro-400">
            {{ formatDateTime(config.lastCheckedAt) }}
          </span>
        </dd>
      </div>
      <div>
        <dt class="text-xs text-oscuro-400">Tiempo de espera</dt>
        <dd class="text-white">{{ (config.timeoutMs / 1000).toLocaleString('es-PE') }} s</dd>
      </div>
      <div v-if="config.lastError" class="sm:col-span-2 lg:col-span-4">
        <dt class="text-xs text-oscuro-400">Último error</dt>
        <dd class="text-red-300">{{ config.lastError }}</dd>
      </div>
    </dl>

    <p
      v-if="config?.encryptionKey === 'none'"
      class="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200"
    >
      El servidor no tiene una clave para cifrar la API key: no se puede guardar.
    </p>

    <AppModal v-model="formOpen" :title="config?.configured ? 'Editar conexión con API UNDC' : 'Conectar API UNDC'" size="lg">
      <form class="space-y-4" autocomplete="off" @submit.prevent="save">
        <label class="block">
          <span class="text-sm text-oscuro-200">URL de la API</span>
          <input
            v-model="form.baseUrl"
            type="url"
            required
            class="input"
            placeholder="https://api-jp.episundc.pe"
          />
          <span class="mt-1 block text-xs text-oscuro-400">
            La de la API, no la del sitio SIGENET. Debe empezar con https://.
          </span>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">
            API key {{ config?.configured ? '(deja vacío para conservar la guardada)' : '' }}
          </span>
          <input
            v-model="form.apiKey"
            type="password"
            autocomplete="new-password"
            :required="!config?.configured"
            class="input"
            placeholder="undc_…"
          />
        </label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm text-oscuro-200">Tiempo de espera (segundos)</span>
            <input v-model.number="form.timeoutSeconds" type="number" min="1" max="30" required class="input" />
          </label>
          <label class="flex items-end gap-2 pb-2 text-sm text-oscuro-200">
            <input v-model="form.enabled" type="checkbox" class="h-4 w-4" />
            Conexión activa
          </label>
        </div>
        <p v-if="formError" class="text-sm text-red-400">{{ formError }}</p>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <button
            v-if="config?.configured"
            type="button"
            class="rounded-lg px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10"
            @click="removeOpen = true"
          >
            Quitar conexión
          </button>
          <span v-else />
          <div class="flex gap-3">
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-semibold text-oscuro-200 hover:bg-oscuro-700"
              @click="formOpen = false"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="rounded-lg bg-green-500 px-5 py-2 text-sm font-semibold text-oscuro-900 hover:bg-green-400 disabled:opacity-60"
              :disabled="saving"
            >
              {{ saving ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </div>
      </form>
    </AppModal>

    <AppConfirm
      v-model="removeOpen"
      title="Quitar la conexión"
      message="Se borrará la URL y la API key guardadas. La búsqueda de alumnos volverá a la búsqueda pública de SIVIRENO, sin DNI."
      confirm-text="Quitar"
      :loading="removing"
      :error="removeError"
      @confirm="remove"
    />
  </section>
</template>

<script setup lang="ts">
import type { UndcApiConfig } from '~/types/domain'
import { formatDateTime } from '~/utils/format'
import { apiMessage } from '~/utils/groups'

/**
 * Conexión con API UNDC (JP) para traer el DNI por código. Solo Owner y Administrador (la página ya
 * exige el rol). La API key se escribe en un campo `password`, se envía una vez y se borra del formulario:
 * nunca se guarda en cookies, localStorage, sessionStorage, stores ni consola.
 */
const api = useApi()

const config = ref<UndcApiConfig | null>(null)
const loading = ref(true)
const loadError = ref('')
const notice = ref<{ ok: boolean; text: string } | null>(null)
const testing = ref(false)

const formOpen = ref(false)
const form = reactive({ baseUrl: '', apiKey: '', timeoutSeconds: 8, enabled: true })
const formError = ref('')
const saving = ref(false)

const removeOpen = ref(false)
const removing = ref(false)
const removeError = ref('')

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    config.value = await api.get<UndcApiConfig>('/settings/undc-api')
  } catch (err) {
    loadError.value = apiMessage(err, 'No se pudo cargar la conexión con API UNDC.')
  } finally {
    loading.value = false
  }
}

function openForm() {
  form.baseUrl = config.value?.baseUrl ?? ''
  form.apiKey = ''
  form.timeoutSeconds = Math.round((config.value?.timeoutMs ?? 8000) / 1000)
  form.enabled = config.value?.enabled ?? true
  formError.value = ''
  formOpen.value = true
}

async function save() {
  formError.value = ''
  saving.value = true
  try {
    config.value = await api.put<UndcApiConfig>('/settings/undc-api', {
      baseUrl: form.baseUrl.trim(),
      ...(form.apiKey.trim() ? { apiKey: form.apiKey.trim() } : {}),
      timeoutMs: Math.round(form.timeoutSeconds * 1000),
      enabled: form.enabled,
    })
    form.apiKey = ''
    formOpen.value = false
    notice.value = { ok: true, text: 'Conexión guardada. Usa «Probar» para comprobarla.' }
  } catch (err) {
    formError.value = apiMessage(err, 'No se pudo guardar la conexión.')
  } finally {
    saving.value = false
    form.apiKey = ''
  }
}

async function runTest() {
  testing.value = true
  notice.value = null
  try {
    const result = await api.post<{ ok: boolean; message: string }>('/settings/undc-api/test')
    notice.value = { ok: result.ok, text: result.message }
  } catch (err) {
    notice.value = { ok: false, text: apiMessage(err, 'No se pudo probar la conexión.') }
  } finally {
    testing.value = false
    await load()
  }
}

async function remove() {
  removing.value = true
  removeError.value = ''
  try {
    await api.del('/settings/undc-api')
    removeOpen.value = false
    formOpen.value = false
    notice.value = { ok: true, text: 'Conexión quitada.' }
    await load()
  } catch (err) {
    removeError.value = apiMessage(err, 'No se pudo quitar la conexión.')
  } finally {
    removing.value = false
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
