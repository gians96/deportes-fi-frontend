<template>
  <div class="flex min-h-[70vh] items-center justify-center">
    <div
      class="w-full max-w-md rounded-2xl border border-oscuro-700 bg-oscuro-850 p-8 text-center"
    >
      <div
        class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/10"
      >
        <Trophy class="h-7 w-7 text-green-400" />
      </div>
      <h1 class="text-2xl font-bold text-white">Deportes FI</h1>
      <p class="mt-2 text-sm text-oscuro-300">
        Ingresa con tu cuenta de Google
      </p>

      <div class="mt-8 flex justify-center">
        <GoogleSignInButton @success="onSuccess" @error="onError" />
      </div>

      <div class="my-6 flex items-center gap-3 text-xs text-oscuro-500">
        <span class="h-px flex-1 bg-oscuro-700" />
        <span>o con correo y contraseña</span>
        <span class="h-px flex-1 bg-oscuro-700" />
      </div>

      <form class="space-y-3 text-left" @submit.prevent="onPasswordSubmit">
        <label class="block">
          <span class="text-sm text-oscuro-200">Correo</span>
          <input
            v-model.trim="email"
            type="email"
            required
            autocomplete="username"
            maxlength="254"
            class="input"
          />
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Contraseña</span>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="current-password"
              maxlength="128"
              class="input pr-20"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-oscuro-300 hover:text-white"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? 'Ocultar' : 'Mostrar' }}
            </button>
          </div>
        </label>
        <button
          type="submit"
          :disabled="auth.loading || !email || !password"
          class="w-full rounded-lg bg-green-500 px-5 py-2.5 font-semibold text-oscuro-900 hover:bg-green-400 disabled:opacity-50"
        >
          Ingresar
        </button>
      </form>

      <p v-if="error" class="mt-4 text-sm text-red-400">{{ error }}</p>
      <p v-if="auth.loading" class="mt-4 text-sm text-oscuro-300">
        Verificando…
      </p>

      <p class="mt-8 text-xs text-oscuro-500">
        Los participantes externos deben validar su DNI para continuar.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Trophy } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ middleware: 'guest' })

const auth = useAuthStore()
const route = useRoute()
const error = ref('')
const email = ref('')
// La contraseña solo vive en este campo mientras se envía: no se guarda en el store ni en el navegador.
const password = ref('')
const showPassword = ref(false)

async function onSuccess() {
  const redirect = (route.query.redirect as string) || '/'
  if (auth.needsProfile) {
    await navigateTo('/completar-perfil')
    return
  }
  if (auth.isAdmin || auth.isTreasurer || auth.isReferee) {
    await navigateTo(auth.homePath)
    return
  }
  await navigateTo(redirect)
}

async function onPasswordSubmit() {
  error.value = ''
  const ok = await auth.loginWithPassword(email.value, password.value)
  password.value = ''
  if (ok) {
    await onSuccess()
    return
  }
  error.value = auth.error ?? 'No se pudo iniciar sesión'
}

function onError(message: string) {
  error.value = message
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
