<template>
  <div class="rounded-xl border border-oscuro-700 bg-oscuro-900/50 p-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-sm font-semibold text-white">{{ title }}</p>
        <p v-if="subtitle" class="mt-0.5 text-xs text-oscuro-400">{{ subtitle }}</p>
      </div>
      <StatusBadge :status="voucher.status" />
    </div>

    <div class="mt-3 grid gap-3 sm:grid-cols-3">
      <div>
        <p class="text-xs text-oscuro-400">Monto</p>
        <p class="font-semibold text-green-400">{{ formatCurrency(voucher.amount) }}</p>
      </div>
      <div>
        <p class="text-xs text-oscuro-400">N° de operación</p>
        <p class="font-semibold text-white">{{ voucher.operationNumber || '—' }}</p>
      </div>
      <div class="flex items-end">
        <VoucherLink :voucher="voucher" :title="title" />
      </div>
    </div>

    <p
      v-if="voucher.status === 'REJECTED' && voucher.rejectionReason"
      class="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300"
    >
      Comprobante rechazado: {{ voucher.rejectionReason }}
    </p>

    <form
      v-if="voucher.status === 'REJECTED'"
      class="mt-3 grid gap-3 sm:grid-cols-2"
      @submit.prevent="submit"
    >
      <label class="block">
        <span class="text-xs text-oscuro-300">N° de operación</span>
        <input v-model="operationNumber" type="text" class="input" />
      </label>
      <label class="block">
        <span class="text-xs text-oscuro-300">Nueva imagen del comprobante</span>
        <input type="file" accept="image/*" class="input" @change="onFile" />
      </label>
      <p v-if="error" class="text-sm text-red-400 sm:col-span-2">{{ error }}</p>
      <button
        type="submit"
        class="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-oscuro-900 transition hover:bg-green-400 disabled:opacity-60 sm:col-span-2"
        :disabled="busy"
      >
        {{ busy ? 'Enviando…' : 'Reenviar comprobante' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { GroupVoucher } from '~/types/domain'
import { formatCurrency } from '~/utils/format'
import { apiMessage } from '~/utils/groups'

const props = defineProps<{
  voucher: GroupVoucher
  title: string
  subtitle?: string
}>()

const emit = defineEmits<{ replaced: [] }>()

const api = useApi()

const operationNumber = ref('')
const file = ref<File | null>(null)
const busy = ref(false)
const error = ref('')

function onFile(e: Event) {
  file.value = (e.target as HTMLInputElement).files?.[0] ?? null
}

async function submit() {
  error.value = ''
  if (!file.value) {
    error.value = 'Adjunta la nueva imagen del comprobante.'
    return
  }
  busy.value = true
  try {
    const fd = new FormData()
    fd.append('operationNumber', operationNumber.value)
    fd.append('voucher', file.value)
    await api.upload(`/vouchers/${props.voucher.id}/replace`, fd, 'PATCH')
    operationNumber.value = ''
    file.value = null
    emit('replaced')
  } catch (err) {
    error.value = apiMessage(err, 'No se pudo reenviar el comprobante.')
  } finally {
    busy.value = false
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
