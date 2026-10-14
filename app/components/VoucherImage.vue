<template>
  <div class="overflow-hidden rounded-2xl border border-oscuro-700 bg-black">
    <div :class="zoomed ? 'max-h-[60vh] overflow-auto' : 'flex max-h-72 items-center justify-center'">
      <img
        :src="src"
        :alt="alt"
        class="w-full"
        :class="zoomed ? 'cursor-zoom-out' : 'max-h-72 cursor-zoom-in object-contain'"
        @click="zoomed = !zoomed"
      />
    </div>
    <button
      type="button"
      class="w-full border-t border-oscuro-700 bg-oscuro-900/70 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:text-sky-200"
      @click="zoomed = !zoomed"
    >
      {{ zoomed ? 'Reducir comprobante' : 'Ampliar comprobante' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { uploadUrl } from '~/utils/groups'

/** Imagen del comprobante dentro del mismo modal: un clic la amplía o la reduce (sin abrir otra ventana). */
const props = withDefaults(defineProps<{ path: string; alt?: string }>(), { alt: 'Comprobante de pago' })

const config = useRuntimeConfig()
const zoomed = ref(false)
const src = computed(() => uploadUrl(config.public.apiBase, props.path))
</script>
