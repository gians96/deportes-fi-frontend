<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4"
        @keydown.esc="close"
      >
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="close"
        />
        <div
          class="relative z-10 w-full rounded-2xl border border-oscuro-700 bg-oscuro-850 shadow-2xl"
          :class="sizeClass"
          role="dialog"
          aria-modal="true"
        >
          <div
            class="flex items-center justify-between gap-3 border-b border-oscuro-700 px-5 py-4"
          >
            <div class="flex min-w-0 items-center gap-3">
              <button
                v-if="backLabel"
                type="button"
                class="flex shrink-0 items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                :aria-label="backLabel"
                @click="emit('back')"
              >
                <ArrowLeft class="h-4 w-4" />
                <span class="hidden sm:inline">{{ backLabel }}</span>
                <span class="sm:hidden">Atrás</span>
              </button>
              <h2 class="min-w-0 text-base font-bold text-white">{{ title }}</h2>
            </div>
            <button
              class="shrink-0 rounded-lg p-1 text-oscuro-300 hover:bg-oscuro-700 hover:text-white"
              aria-label="Cerrar"
              @click="close"
            >
              <X class="h-5 w-5" />
            </button>
          </div>
          <div class="max-h-[80vh] overflow-y-auto px-5 py-4">
            <slot />
          </div>
          <div
            v-if="$slots.footer"
            class="border-t border-oscuro-700 px-5 py-4"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeft, X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    size?: 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl'
    /** Si se indica, la cabecera muestra un botón «← {texto}» que emite `back` (volver al panel anterior). */
    backLabel?: string
  }>(),
  { size: 'lg', backLabel: '' },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  back: []
}>()

const sizeClass = computed(
  () =>
    ({
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '4xl': 'max-w-4xl',
      '6xl': 'max-w-6xl',
    })[props.size],
)

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
