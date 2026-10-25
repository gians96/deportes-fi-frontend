<template>
  <div>
    <div class="flex flex-wrap items-center gap-2">
      <button
        v-if="voucher.status !== 'PENDING'"
        type="button"
        class="rounded-lg bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/25 disabled:opacity-50"
        :disabled="busy"
        @click="emit('reopen')"
      >
        Volver a pendiente
      </button>
      <button
        v-if="!editing"
        type="button"
        class="rounded-lg bg-oscuro-700/60 px-3 py-1.5 text-xs font-semibold text-oscuro-100 hover:bg-oscuro-700 disabled:opacity-50"
        :disabled="busy"
        @click="startEdit"
      >
        Corregir N.° de operación y monto
      </button>
    </div>
    <p v-if="voucher.status !== 'PENDING'" class="mt-1.5 text-xs text-oscuro-300">
      «Volver a pendiente» deshace la validación o el rechazo del comprobante; los equipos que se aprobaron con él
      también vuelven a pendiente.
    </p>

    <form v-if="editing" class="mt-3 grid gap-3 sm:grid-cols-2" @submit.prevent="submitEdit">
      <label class="block">
        <span class="text-xs text-oscuro-300">N.° de operación</span>
        <input v-model="form.operationNumber" type="text" maxlength="50" class="input" />
      </label>
      <label class="block">
        <span class="text-xs text-oscuro-300">Monto (S/)</span>
        <input v-model.number="form.amount" type="number" min="0" step="0.01" required class="input" />
      </label>
      <p class="text-xs text-oscuro-300 sm:col-span-2">
        Es una corrección manual: no recalcula las tarifas del evento ni cambia el estado del comprobante.
      </p>
      <div class="flex justify-end gap-2 sm:col-span-2">
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-xs font-semibold text-oscuro-200 hover:bg-oscuro-700"
          @click="editing = false"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="rounded-lg bg-green-500 px-4 py-1.5 text-xs font-semibold text-oscuro-900 hover:bg-green-400 disabled:opacity-50"
          :disabled="busy || !validAmount"
        >
          Guardar datos
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { VoucherStatus } from '~/types/domain'

/**
 * Acciones de Owner y Administrador sobre un comprobante ya revisado o por revisar: volver a pendiente (deshacer
 * un «validar» o «rechazar» equivocado) y corregir a mano el N.° de operación y el monto. Las usan el panel del
 * equipo (voucher propio) y el panel de pago de un salón o ciclo.
 */
const props = defineProps<{
  voucher: { id: number; status: VoucherStatus; operationNumber?: string | null; amount: number | string }
  busy: boolean
}>()

const emit = defineEmits<{
  reopen: []
  edit: [data: { operationNumber: string; amount: number }]
}>()

const editing = ref(false)
const form = reactive({ operationNumber: '', amount: 0 })

const validAmount = computed(() => Number.isFinite(form.amount) && form.amount >= 0)

function startEdit() {
  form.operationNumber = props.voucher.operationNumber ?? ''
  form.amount = Number(props.voucher.amount)
  editing.value = true
}

function submitEdit() {
  if (!validAmount.value) return
  emit('edit', { operationNumber: form.operationNumber.trim(), amount: Number(form.amount.toFixed(2)) })
  editing.value = false
}
</script>

<style scoped>
.input {
  margin-top: 0.25rem;
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid rgba(55, 65, 81, 0.4);
  background-color: #182029;
  padding: 0.5rem 0.75rem;
  color: white;
  outline: none;
}
.input:focus {
  border-color: #4ade80;
  box-shadow: 0 0 0 1px rgba(74, 222, 128, 0.4);
}
</style>
