<template>
  <div class="flex min-h-[70vh] items-center justify-center">
    <div
      class="w-full max-w-md rounded-2xl border border-oscuro-700 bg-oscuro-850 p-8"
    >
      <div
        class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/10"
      >
        <GraduationCap class="h-7 w-7 text-green-400" />
      </div>
      <h1 class="text-center text-2xl font-bold text-white">
        Completa tu perfil
      </h1>
      <p class="mt-2 text-center text-sm text-oscuro-300">
        {{ profileIntro }}
      </p>

      <form class="mt-8 space-y-4" @submit.prevent="save">
        <label v-if="needsAcademicProfile" class="block">
          <span class="text-sm text-oscuro-200">Facultad</span>
          <select v-model.number="form.facultyId" required class="input">
            <option :value="0" disabled>Selecciona una facultad</option>
            <option v-for="f in faculties" :key="f.id" :value="f.id">
              {{ f.name }}
            </option>
          </select>
        </label>

        <label v-if="needsAcademicProfile" class="block">
          <span class="text-sm text-oscuro-200">Escuela profesional</span>
          <select
            v-model.number="form.schoolId"
            required
            :disabled="!form.facultyId"
            class="input"
          >
            <option :value="0" disabled>Selecciona una escuela</option>
            <option v-for="s in schoolsOfFaculty" :key="s.id" :value="s.id">
              {{ s.name }}
            </option>
          </select>
        </label>

        <label v-if="needsDni" class="block">
          <span class="text-sm text-oscuro-200">DNI</span>
          <input
            v-model="form.dni"
            type="text"
            inputmode="numeric"
            maxlength="8"
            required
            placeholder="8 dígitos"
            class="input"
          />
          <span class="mt-1 block text-xs text-oscuro-400">
            Validaremos tu identidad con Decolecta para completar tu cuenta institucional.
          </span>
        </label>

        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

        <button
          type="submit"
          :disabled="saving"
          class="w-full rounded-lg bg-green-500 px-5 py-2.5 font-semibold text-oscuro-900 transition hover:bg-green-400 disabled:opacity-60"
        >
          {{ saving ? 'Guardando…' : 'Guardar y continuar' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { GraduationCap } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()
const { faculties, load } = useFaculties()

const form = reactive({
  facultyId: auth.user?.facultyId ?? 0,
  schoolId: auth.user?.schoolId ?? 0,
  dni: auth.user?.dni ?? '',
})
const error = ref('')
const saving = ref(false)

// Los usuarios institucionales no estudiantes completan el perfil solo con DNI.
const needsAcademicProfile = computed(() => auth.user?.role === 'STUDENT')
const needsDni = computed(() => auth.user?.role === 'OTHER')
const profileIntro = computed(() =>
  needsDni.value
    ? 'Ingresa tu DNI para validar tu cuenta institucional.'
    : 'Selecciona tu facultad y escuela profesional para continuar.',
)

const schoolsOfFaculty = computed(
  () => faculties.value.find((f) => f.id === form.facultyId)?.schools ?? [],
)

watch(
  () => form.facultyId,
  (next, prev) => {
    if (prev !== undefined && next !== prev) form.schoolId = 0
  },
)

async function save() {
  error.value = ''
  if (needsAcademicProfile.value && (!form.facultyId || !form.schoolId)) {
    error.value = 'Selecciona facultad y escuela'
    return
  }
  if (needsDni.value && !/^\d{8}$/.test(form.dni)) {
    error.value = 'Ingresa un DNI válido de 8 dígitos'
    return
  }
  saving.value = true
  try {
    await auth.updateProfile(
      needsDni.value
        ? { dni: form.dni }
        : { facultyId: form.facultyId, schoolId: form.schoolId },
    )
    await navigateTo(auth.homePath)
  } catch (err: unknown) {
    error.value =
      (err as { data?: { message?: string } })?.data?.message ??
      'No se pudo guardar el perfil'
  } finally {
    saving.value = false
  }
}

onMounted(() => load())
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
