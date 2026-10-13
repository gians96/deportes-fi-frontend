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
            class="flex items-center justify-between border-b border-oscuro-700 px-5 py-4"
          >
            <h2 class="text-base font-bold text-white">{{ title }}</h2>
            <button
              class="rounded-lg p-1 text-oscuro-400 hover:bg-oscuro-700 hover:text-white"
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
import { X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    size?: 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl'
  }>(),
  { size: 'lg' },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
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
