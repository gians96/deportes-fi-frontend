<template>
  <div>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-white">Usuarios</h1>
        <p class="mt-1 text-sm text-oscuro-300">
          Gestiona el acceso, los roles y el estado de las cuentas.
        </p>
      </div>
      <button
        class="rounded-lg bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300 hover:bg-green-500/20"
        @click="openCreate"
      >
        Nuevo usuario
      </button>
    </div>

    <p v-if="error" class="mt-4 text-sm text-red-400">{{ error }}</p>

    <div class="mt-6 overflow-x-auto rounded-xl border border-oscuro-700">
      <table class="w-full text-left text-sm">
        <thead class="bg-oscuro-800 text-oscuro-300">
          <tr>
            <th class="px-4 py-3">Nombre</th>
            <th class="px-4 py-3">Correo</th>
            <th class="px-4 py-3">Facultad / Escuela</th>
            <th class="px-4 py-3">Rol</th>
            <th class="px-4 py-3">Acceso</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-oscuro-700 bg-oscuro-850">
          <tr v-for="u in users" :key="u.id">
            <td class="px-4 py-3 font-semibold text-white">{{ u.fullName }}</td>
            <td class="px-4 py-3 text-oscuro-300">{{ u.email }}</td>
            <td class="px-4 py-3 text-oscuro-300">
              <span v-if="u.facultyId">{{ facultyName(u.facultyId) }}</span>
              <span v-else class="text-oscuro-500">—</span>
              <span v-if="u.schoolId" class="block text-xs text-oscuro-500">
                {{ schoolName(u.schoolId) }}
              </span>
            </td>
            <td class="px-4 py-3">
              <select
                v-model="u.role"
                class="rounded-lg border border-oscuro-700 bg-oscuro-900/60 px-2 py-1 text-sm text-white disabled:opacity-50"
                :disabled="!canEdit(u)"
                @change="updateRole(u)"
              >
                <option value="STUDENT">Estudiante</option>
                <option value="OTHER">Otro</option>
                <option value="REFEREE">Árbitro</option>
                <option value="TREASURER">Tesorero</option>
                <option v-if="auth.isOwner" value="ADMIN_SYSTEM">
                  Administrador
                </option>
                <option v-if="auth.isOwner" value="OWNER_SYSTEM">Owner</option>
              </select>
            </td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="
                  u.hasPassword
                    ? 'bg-sky-500/10 text-sky-300'
                    : 'bg-oscuro-800 text-oscuro-300'
                "
              >
                {{ u.hasPassword ? 'Contraseña o Google' : 'Solo Google' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="
                  u.isActive
                    ? 'bg-green-500/10 text-green-300'
                    : 'bg-red-500/10 text-red-300'
                "
              >
                {{ u.isActive ? 'Activo' : 'Inhabilitado' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div v-if="canEdit(u)" class="flex items-center gap-3">
                <button
                  class="text-sm font-semibold text-sky-300 hover:text-sky-200"
                  @click="openEdit(u)"
                >
                  Editar
                </button>
                <button
                  class="text-sm font-semibold text-amber-300 hover:text-amber-200"
                  @click="openPassword(u)"
                >
                  Contraseña
                </button>
                <button
                  class="text-sm font-semibold hover:opacity-80"
                  :class="u.isActive ? 'text-red-400' : 'text-green-400'"
                  @click="askToggleActive(u)"
                >
                  {{ u.isActive ? 'Inhabilitar' : 'Habilitar' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Crear usuario -->
    <AppModal v-model="createOpen" title="Nuevo usuario">
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="createUser">
        <label class="block sm:col-span-2">
          <span class="text-sm text-oscuro-200">Nombre completo</span>
          <input v-model="createForm.fullName" required class="input" />
        </label>
        <label class="block sm:col-span-2">
          <span class="text-sm text-oscuro-200">Correo</span>
          <input v-model="createForm.email" type="email" required class="input" />
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">Rol</span>
          <select v-model="createForm.role" class="input">
            <option value="STUDENT">Estudiante</option>
            <option value="OTHER">Otro</option>
            <option value="REFEREE">Árbitro</option>
            <option value="TREASURER">Tesorero</option>
            <option v-if="auth.isOwner" value="ADMIN_SYSTEM">Administrador</option>
            <option v-if="auth.isOwner" value="OWNER_SYSTEM">Owner</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">DNI (opcional)</span>
          <input v-model="createForm.dni" class="input" />
        </label>
        <label v-if="!isNonAcademicRole(createForm.role)" class="block">
          <span class="text-sm text-oscuro-200">Facultad (opcional)</span>
          <select v-model.number="createForm.facultyId" class="input">
            <option :value="0">Sin facultad</option>
            <option v-for="f in faculties" :key="f.id" :value="f.id">
              {{ f.name }}
            </option>
          </select>
        </label>
        <label v-if="!isNonAcademicRole(createForm.role)" class="block">
          <span class="text-sm text-oscuro-200">Escuela (opcional)</span>
          <select v-model.number="createForm.schoolId" class="input">
            <option :value="0">Sin escuela</option>
            <option v-for="s in createSchools" :key="s.id" :value="s.id">
              {{ s.name }}
            </option>
          </select>
        </label>
        <fieldset class="sm:col-span-2">
          <legend class="text-sm text-oscuro-200">Acceso</legend>
          <div class="mt-1 grid gap-3 sm:grid-cols-2">
            <label
              class="access-option"
              :class="{ 'access-option-active': createForm.accessMode === 'GOOGLE' }"
            >
              <input v-model="createForm.accessMode" type="radio" value="GOOGLE" class="mt-1" />
              <span>
                <span class="block text-sm font-semibold text-white">Solo Google</span>
                <span class="block text-xs text-oscuro-300">
                  Entra con «Continuar con Google» usando este correo (Gmail o cuenta institucional).
                </span>
              </span>
            </label>
            <label
              class="access-option"
              :class="{ 'access-option-active': createForm.accessMode === 'PASSWORD' }"
            >
              <input v-model="createForm.accessMode" type="radio" value="PASSWORD" class="mt-1" />
              <span>
                <span class="block text-sm font-semibold text-white">Contraseña o Google</span>
                <span class="block text-xs text-oscuro-300">
                  Entra con este correo y una contraseña; también puede usar Google.
                </span>
              </span>
            </label>
          </div>
        </fieldset>
        <div v-if="createForm.accessMode === 'PASSWORD'" class="sm:col-span-2">
          <label class="block">
          <span class="text-sm text-oscuro-200">Contraseña (10 a 128 caracteres)</span>
          <div class="mt-1 flex gap-2">
            <input
              v-model="createForm.password"
              :type="createForm.showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              minlength="10"
              maxlength="128"
              required
              class="input !mt-0 font-mono"
            />
            <button
              type="button"
              class="shrink-0 rounded-lg border border-oscuro-700 px-3 text-xs font-semibold text-oscuro-200 hover:text-white"
              @click="createForm.showPassword = !createForm.showPassword"
            >
              {{ createForm.showPassword ? 'Ocultar' : 'Mostrar' }}
            </button>
            <button
              type="button"
              class="shrink-0 rounded-lg border border-oscuro-700 px-3 text-xs font-semibold text-oscuro-200 hover:text-white"
              @click="fillGenerated(createForm)"
            >
              Generar
            </button>
            <button
              type="button"
              class="shrink-0 rounded-lg border border-oscuro-700 px-3 text-xs font-semibold text-oscuro-200 hover:text-white disabled:opacity-50"
              :disabled="!createForm.password"
              @click="copyPassword(createForm.password)"
            >
              {{ copied ? 'Copiado' : 'Copiar' }}
            </button>
          </div>
          </label>
          <p class="mt-1 text-xs text-oscuro-400">
            Entrega la contraseña por un canal seguro: no se vuelve a mostrar.
          </p>
          <p
            v-if="createForm.role === 'STUDENT' && (!createForm.facultyId || !createForm.schoolId)"
            class="mt-1 text-xs text-amber-300"
          >
            Sin facultad y escuela, el estudiante tendrá que completar su perfil al entrar.
          </p>
        </div>
        <p v-if="modalError" class="text-sm text-red-400 sm:col-span-2">{{ modalError }}</p>
        <button
          type="submit"
          class="rounded-lg bg-green-500 px-5 py-2.5 font-semibold text-oscuro-900 hover:bg-green-400 sm:col-span-2"
        >
          Crear usuario
        </button>
      </form>
      <p class="mt-3 text-xs text-oscuro-400">
        {{
          createForm.accessMode === 'PASSWORD'
            ? 'La persona entra desde «Ingresar» con este correo y la contraseña.'
            : 'El acceso se activa cuando la persona inicia sesión con Google usando este correo.'
        }}
      </p>
    </AppModal>

    <!-- Editar usuario -->
    <AppModal v-model="editOpen" title="Editar usuario">
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="saveUser">
        <label class="block sm:col-span-2">
          <span class="text-sm text-oscuro-200">Nombre completo</span>
          <input v-model="editForm.fullName" required class="input" />
        </label>
        <label class="block sm:col-span-2">
          <span class="text-sm text-oscuro-200">Correo</span>
          <input v-model="editForm.email" type="email" required class="input" />
        </label>
        <label class="block">
          <span class="text-sm text-oscuro-200">DNI</span>
          <input v-model="editForm.dni" class="input" />
        </label>
        <label v-if="!isNonAcademicRole(editForm.role)" class="block">
          <span class="text-sm text-oscuro-200">Facultad</span>
          <select v-model.number="editForm.facultyId" class="input">
            <option :value="0">Sin facultad</option>
            <option v-for="f in faculties" :key="f.id" :value="f.id">
              {{ f.name }}
            </option>
          </select>
        </label>
        <label v-if="!isNonAcademicRole(editForm.role)" class="block sm:col-span-2">
          <span class="text-sm text-oscuro-200">Escuela</span>
          <select v-model.number="editForm.schoolId" class="input">
            <option :value="0">Sin escuela</option>
            <option v-for="s in editSchools" :key="s.id" :value="s.id">
              {{ s.name }}
            </option>
          </select>
        </label>
        <p v-if="modalError" class="text-sm text-red-400 sm:col-span-2">{{ modalError }}</p>
        <button
          type="submit"
          class="rounded-lg bg-green-500 px-5 py-2.5 font-semibold text-oscuro-900 hover:bg-green-400 sm:col-span-2"
        >
          Guardar cambios
        </button>
      </form>
    </AppModal>

    <!-- Confirmar inhabilitar/habilitar -->
    <AppConfirm
      v-model="confirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-text="confirmText"
      :loading="confirmLoading"
      :error="modalError"
      @confirm="runToggleActive"
    />

    <!-- Contraseña de una cuenta -->
    <AppModal
      v-model="passwordOpen"
      :title="'Contraseña de ' + (passwordTarget?.fullName ?? '')"
    >
      <form class="grid gap-4" @submit.prevent="savePassword">
        <p class="text-sm text-oscuro-300">
          {{
            passwordTarget?.hasPassword
              ? 'Esta cuenta ya entra con contraseña. Al cambiarla se cierran sus sesiones abiertas.'
              : 'Con una contraseña la cuenta podrá entrar con correo y contraseña, además de Google.'
          }}
        </p>
        <label class="block">
          <span class="text-sm text-oscuro-200">Contraseña (10 a 128 caracteres)</span>
          <div class="mt-1 flex gap-2">
            <input
              v-model="passwordForm.password"
              :type="passwordForm.showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              minlength="10"
              maxlength="128"
              required
              class="input !mt-0 font-mono"
            />
            <button
              type="button"
              class="shrink-0 rounded-lg border border-oscuro-700 px-3 text-xs font-semibold text-oscuro-200 hover:text-white"
              @click="passwordForm.showPassword = !passwordForm.showPassword"
            >
              {{ passwordForm.showPassword ? 'Ocultar' : 'Mostrar' }}
            </button>
            <button
              type="button"
              class="shrink-0 rounded-lg border border-oscuro-700 px-3 text-xs font-semibold text-oscuro-200 hover:text-white"
              @click="fillGenerated(passwordForm)"
            >
              Generar
            </button>
            <button
              type="button"
              class="shrink-0 rounded-lg border border-oscuro-700 px-3 text-xs font-semibold text-oscuro-200 hover:text-white disabled:opacity-50"
              :disabled="!passwordForm.password"
              @click="copyPassword(passwordForm.password)"
            >
              {{ copied ? 'Copiado' : 'Copiar' }}
            </button>
          </div>
        </label>
        <p v-if="modalError" class="text-sm text-red-400">{{ modalError }}</p>
        <button
          type="submit"
          class="rounded-lg bg-green-500 px-5 py-2.5 font-semibold text-oscuro-900 hover:bg-green-400"
        >
          Guardar contraseña
        </button>
        <button
          v-if="passwordTarget?.hasPassword"
          type="button"
          class="rounded-lg border border-red-500/40 px-5 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/10"
          @click="askRemovePassword"
        >
          Quitar contraseña (solo Google)
        </button>
      </form>
    </AppModal>

    <AppConfirm
      v-model="removePasswordOpen"
      title="Quitar contraseña"
      :message="'La cuenta de ' + (passwordTarget?.fullName ?? '') + ' volverá a entrar solo con Google y se cerrarán sus sesiones abiertas.'"
      confirm-text="Quitar"
      :loading="removePasswordLoading"
      :error="modalError"
      @confirm="runRemovePassword"
    />
  </div>
</template>

<script setup lang="ts">
import type { AuthUser } from '~/types/domain'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const api = useApi()
const auth = useAuthStore()
const { faculties, load: loadFaculties } = useFaculties()
const users = ref<AuthUser[]>([])
const error = ref('')
const modalError = ref('')

function facultyName(id: number) {
  return faculties.value.find((f) => f.id === id)?.name ?? `#${id}`
}

function schoolName(id: number) {
  for (const f of faculties.value) {
    const s = f.schools?.find((sc) => sc.id === id)
    if (s) return s.name
  }
  return `#${id}`
}

function schoolsOf(facultyId: number) {
  return faculties.value.find((f) => f.id === facultyId)?.schools ?? []
}

function showModalError(err: unknown, fallback: string) {
  modalError.value =
    (err as { data?: { message?: string | string[] } })?.data?.message?.toString() ??
    fallback
}

function isNonAcademicRole(role: AuthUser['role']) {
  return role === 'OTHER' || role === 'REFEREE' || role === 'TREASURER'
}

// Un owner puede editar a cualquiera salvo otros owners.
// Un admin solo puede editar usuarios no administrativos.
function canEdit(u: AuthUser) {
  if (u.role === 'OWNER_SYSTEM') return false
  if (u.id === auth.user?.id) return false
  if (auth.isOwner) return true
  return (
    u.role === 'STUDENT' ||
    u.role === 'OTHER' ||
    u.role === 'REFEREE' ||
    u.role === 'TREASURER'
  )
}

async function load() {
  try {
    users.value = await api.get<AuthUser[]>('/users')
  } catch {
    users.value = []
  }
}

async function updateRole(u: AuthUser) {
  error.value = ''
  try {
    await api.patch(`/users/${u.id}/role`, { role: u.role })
    await load()
  } catch (err: unknown) {
    error.value =
      (err as { data?: { message?: string } })?.data?.message ??
      'No se pudo actualizar el rol'
    await load()
  }
}

// --- Contraseñas: generar, copiar, validar ---
const PASSWORD_HINT = 'La contraseña debe tener entre 10 y 128 caracteres.'
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
const copied = ref(false)

function validPassword(value: string) {
  return value.length >= 10 && value.length <= 128
}

/** Contraseña aleatoria legible (sin caracteres ambiguos); solo se genera al pulsar «Generar». */
function generatePassword(length = 14) {
  const limit = 256 - (256 % PASSWORD_ALPHABET.length)
  let out = ''
  while (out.length < length) {
    for (const byte of crypto.getRandomValues(new Uint8Array(length * 2))) {
      if (byte < limit && out.length < length) {
        out += PASSWORD_ALPHABET[byte % PASSWORD_ALPHABET.length]
      }
    }
  }
  return out
}

function fillGenerated(form: { password: string; showPassword: boolean }) {
  form.password = generatePassword()
  form.showPassword = true
}

async function copyPassword(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    // Sin permiso de portapapeles: la persona puede seleccionarla y copiarla a mano.
  }
}

// --- Crear usuario ---
const createOpen = ref(false)
const createForm = reactive({
  fullName: '',
  email: '',
  role: 'STUDENT' as AuthUser['role'],
  dni: '',
  facultyId: 0,
  schoolId: 0,
  accessMode: 'GOOGLE' as 'GOOGLE' | 'PASSWORD',
  // La contraseña solo vive en este formulario mientras se envía; no se guarda en el navegador.
  password: '',
  showPassword: false,
})
const createSchools = computed(() => schoolsOf(createForm.facultyId))
watch(
  () => createForm.role,
  (role) => {
    if (isNonAcademicRole(role)) {
      createForm.facultyId = 0
      createForm.schoolId = 0
    }
  },
)
watch(
  () => createForm.facultyId,
  () => {
    createForm.schoolId = 0
  },
)

function openCreate() {
  modalError.value = ''
  Object.assign(createForm, {
    fullName: '',
    email: '',
    role: 'STUDENT',
    dni: '',
    facultyId: 0,
    schoolId: 0,
    accessMode: 'GOOGLE',
    password: '',
    showPassword: false,
  })
  createOpen.value = true
}

async function createUser() {
  modalError.value = ''
  if (createForm.accessMode === 'PASSWORD' && !validPassword(createForm.password)) {
    modalError.value = PASSWORD_HINT
    return
  }
  try {
    await api.post('/users', {
      fullName: createForm.fullName,
      email: createForm.email,
      role: createForm.role,
      dni: createForm.dni || undefined,
      facultyId: isNonAcademicRole(createForm.role) ? undefined : createForm.facultyId || undefined,
      schoolId: isNonAcademicRole(createForm.role) ? undefined : createForm.schoolId || undefined,
      password: createForm.accessMode === 'PASSWORD' ? createForm.password : undefined,
    })
    createForm.password = ''
    createOpen.value = false
    await load()
  } catch (err) {
    showModalError(err, 'No se pudo crear el usuario')
  }
}

// --- Editar usuario ---
const editOpen = ref(false)
const editId = ref<number | null>(null)
const editForm = reactive({
  fullName: '',
  email: '',
  role: 'STUDENT' as AuthUser['role'],
  dni: '',
  facultyId: 0,
  schoolId: 0,
})
const editSchools = computed(() => schoolsOf(editForm.facultyId))
watch(
  () => editForm.role,
  (role) => {
    if (isNonAcademicRole(role)) {
      editForm.facultyId = 0
      editForm.schoolId = 0
    }
  },
)
watch(
  () => editForm.facultyId,
  (nv, ov) => {
    if (ov !== 0) editForm.schoolId = 0
  },
)

function openEdit(u: AuthUser) {
  modalError.value = ''
  editId.value = u.id
  Object.assign(editForm, {
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    dni: u.dni ?? '',
    facultyId: u.facultyId ?? 0,
    schoolId: u.schoolId ?? 0,
  })
  editOpen.value = true
}

async function saveUser() {
  modalError.value = ''
  try {
    await api.patch(`/users/${editId.value}`, {
      fullName: editForm.fullName,
      email: editForm.email,
      dni: editForm.dni || null,
      facultyId: isNonAcademicRole(editForm.role) ? null : editForm.facultyId || null,
      schoolId: isNonAcademicRole(editForm.role) ? null : editForm.schoolId || null,
    })
    editOpen.value = false
    await load()
  } catch (err) {
    showModalError(err, 'No se pudo actualizar el usuario')
  }
}

// --- Contraseña de una cuenta existente ---
const passwordOpen = ref(false)
const passwordTarget = ref<AuthUser | null>(null)
const passwordForm = reactive({ password: '', showPassword: false })
const removePasswordOpen = ref(false)
const removePasswordLoading = ref(false)

function openPassword(u: AuthUser) {
  modalError.value = ''
  passwordTarget.value = u
  Object.assign(passwordForm, { password: '', showPassword: false })
  passwordOpen.value = true
}

async function savePassword() {
  if (!passwordTarget.value) return
  modalError.value = ''
  if (!validPassword(passwordForm.password)) {
    modalError.value = PASSWORD_HINT
    return
  }
  try {
    await api.patch(`/users/${passwordTarget.value.id}/password`, {
      password: passwordForm.password,
    })
    passwordForm.password = ''
    passwordOpen.value = false
    await load()
  } catch (err) {
    showModalError(err, 'No se pudo guardar la contraseña')
  }
}

function askRemovePassword() {
  modalError.value = ''
  passwordForm.password = ''
  passwordOpen.value = false
  removePasswordOpen.value = true
}

async function runRemovePassword() {
  if (!passwordTarget.value) return
  removePasswordLoading.value = true
  modalError.value = ''
  try {
    await api.patch(`/users/${passwordTarget.value.id}/password`, { password: null })
    removePasswordOpen.value = false
    await load()
  } catch (err) {
    showModalError(err, 'No se pudo quitar la contraseña')
  } finally {
    removePasswordLoading.value = false
  }
}

// --- Inhabilitar / habilitar ---
const confirmOpen = ref(false)
const confirmLoading = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmText = ref('')
const toggleTarget = ref<AuthUser | null>(null)

function askToggleActive(u: AuthUser) {
  modalError.value = ''
  toggleTarget.value = u
  if (u.isActive) {
    confirmTitle.value = 'Inhabilitar usuario'
    confirmMessage.value = `¿Inhabilitar a "${u.fullName}"? No podrá iniciar sesión hasta reactivarlo.`
    confirmText.value = 'Inhabilitar'
  } else {
    confirmTitle.value = 'Habilitar usuario'
    confirmMessage.value = `¿Habilitar nuevamente a "${u.fullName}"?`
    confirmText.value = 'Habilitar'
  }
  confirmOpen.value = true
}

async function runToggleActive() {
  if (!toggleTarget.value) return
  confirmLoading.value = true
  modalError.value = ''
  try {
    await api.patch(`/users/${toggleTarget.value.id}/active`, {
      isActive: !toggleTarget.value.isActive,
    })
    confirmOpen.value = false
    toggleTarget.value = null
    await load()
  } catch (err) {
    showModalError(err, 'No se pudo cambiar el estado')
  } finally {
    confirmLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([load(), loadFaculties()])
})
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
.access-option {
  display: flex;
  gap: 0.75rem;
  cursor: pointer;
  border-radius: 0.75rem;
  border: 1px solid rgba(55, 65, 81, 0.6);
  padding: 0.75rem;
}
.access-option-active {
  border-color: #4ade80;
  background-color: rgba(34, 197, 94, 0.08);
}
</style>
