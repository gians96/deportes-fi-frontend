<template>
  <span class="inline-flex">
    <button
      type="button"
      class="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-300 hover:text-sky-200"
      @click="open = true"
    >
      <ReceiptText class="h-4 w-4" /> {{ label }}
    </button>
    <VoucherViewerModal
      v-model="open"
      :image-url="voucher.imageUrl"
      :title="title"
      :amount="voucher.amount"
      :operation-number="voucher.operationNumber"
      :status="voucher.status"
    />
  </span>
</template>

<script setup lang="ts">
import { ReceiptText } from 'lucide-vue-next'

/** Botón «Ver comprobante» que abre el visor en la misma página (sin pestaña nueva). */
withDefaults(
  defineProps<{
    voucher: {
      imageUrl: string
      amount?: number
      operationNumber?: string | null
      status?: string
    }
    title?: string
    label?: string
  }>(),
  { title: 'Comprobante de pago', label: 'Ver comprobante' },
)

const open = ref(false)
</script>
