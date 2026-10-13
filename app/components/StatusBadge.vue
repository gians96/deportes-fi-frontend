<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
    :class="classes"
  >
    <span class="h-1.5 w-1.5 rounded-full" :class="dotClass"></span>
    {{ label }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{ status: string }>()

const map: Record<string, { label: string; classes: string; dot: string }> = {
  PENDING: {
    label: 'Pendiente',
    classes: 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20',
    dot: 'bg-yellow-400',
  },
  APPROVED: {
    label: 'Aprobado',
    classes: 'bg-green-500/10 text-green-300 border border-green-500/20',
    dot: 'bg-green-400',
  },
  VALIDATED: {
    label: 'Validado',
    classes: 'bg-green-500/10 text-green-300 border border-green-500/20',
    dot: 'bg-green-400',
  },
  REJECTED: {
    label: 'Rechazado',
    classes: 'bg-red-500/10 text-red-300 border border-red-500/20',
    dot: 'bg-red-400',
  },
  DRAFT: {
    label: 'Borrador',
    classes: 'bg-sky-500/10 text-sky-300 border border-sky-500/20',
    dot: 'bg-sky-400',
  },
  CANCELLED: {
    label: 'Cancelado',
    classes: 'bg-oscuro-600/40 text-oscuro-200 border border-oscuro-600',
    dot: 'bg-oscuro-300',
  },
}

const current = computed(
  () => map[props.status] ?? map.PENDING!,
)
const label = computed(() => current.value.label)
const classes = computed(() => current.value.classes)
const dotClass = computed(() => current.value.dot)
</script>
