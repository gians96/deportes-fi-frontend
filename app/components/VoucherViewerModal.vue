<template>
  <AppModal
    :model-value="modelValue"
    :title="heading"
    size="2xl"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-3">
      <dl
        v-if="amount !== undefined || operationNumber || status"
        class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3"
      >
        <div v-if="amount !== undefined">
          <dt class="text-xs text-oscuro-400">Monto</dt>
          <dd class="font-semibold text-green-400">{{ formatCurrency(amount) }}</dd>
        </div>
        <div v-if="operationNumber">
          <dt class="text-xs text-oscuro-400">N° de operación</dt>
          <dd class="break-all font-semibold text-white">{{ operationNumber }}</dd>
        </div>
        <div v-if="status" class="col-span-2 sm:col-span-1">
          <dt class="text-xs text-oscuro-400">Estado</dt>
          <dd class="mt-0.5"><StatusBadge :status="status" /></dd>
        </div>
      </dl>

      <div
        class="relative overflow-auto rounded-xl border border-oscuro-700 bg-black/60"
        :class="zoomed ? 'max-h-[65vh]' : ''"
      >
        <p v-if="state === 'loading'" class="p-10 text-center text-sm text-oscuro-400">
          Cargando comprobante…
        </p>
        <div v-else-if="state === 'error'" class="space-y-2 p-10 text-center text-sm">
          <p class="text-red-300">No se pudo cargar la imagen del comprobante.</p>
          <a
            :href="src"
            target="_blank"
            rel="noopener"
            class="font-semibold text-sky-300 underline hover:text-sky-200"
          >
            Intentar abrirla en otra pestaña
          </a>
        </div>
        <img
          v-show="state === 'ready'"
          :src="src"
          alt="Comprobante de pago"
          class="mx-auto block"
          :class="zoomed ? 'max-w-none' : 'max-h-[65vh] w-auto max-w-full object-contain'"
          @load="state = 'ready'"
          @error="state = 'error'"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg bg-oscuro-700/60 px-3 py-2 text-sm font-semibold text-oscuro-100 hover:bg-oscuro-700 disabled:opacity-50"
            :disabled="state !== 'ready'"
            @click="zoomed = !zoomed"
          >
            <component :is="zoomed ? ZoomOut : ZoomIn" class="h-4 w-4" />
            {{ zoomed ? 'Ajustar a la pantalla' : 'Tamaño real' }}
          </button>
          <a
            :href="src"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-500/10"
          >
            <ExternalLink class="h-4 w-4" /> Abrir en otra pestaña
          </a>
        </div>
        <button
          type="button"
          class="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-oscuro-900 hover:bg-green-400"
          @click="emit('update:modelValue', false)"
        >
          Cerrar
        </button>
      </div>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ExternalLink, ZoomIn, ZoomOut } from 'lucide-vue-next'
import { formatCurrency } from '~/utils/format'
import { uploadUrl } from '~/utils/groups'

/**
 * Visor del comprobante de pago dentro de la misma página: imagen ajustada a la pantalla, zoom a tamaño
 * real con desplazamiento y enlace para abrirla en otra pestaña. Sirve a delegado, tesorero y administrador.
 */
const props = defineProps<{
  modelValue: boolean
  /** Ruta que devuelve la API (`/uploads/vouchers/…`) o una URL completa. */
  imageUrl: string
  title?: string
  amount?: number
  operationNumber?: string | null
  status?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const config = useRuntimeConfig()
const src = computed(() => uploadUrl(config.public.apiBase, props.imageUrl))
const state = ref<'loading' | 'ready' | 'error'>('loading')
const zoomed = ref(false)

const heading = computed(() => props.title ?? 'Comprobante de pago')

watch(
  () => [props.modelValue, props.imageUrl],
  () => {
    state.value = 'loading'
    zoomed.value = false
  },
)
</script>
