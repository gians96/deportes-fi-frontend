<template>
  <nav class="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm" :aria-label="`Paginación de ${label}`">
    <p class="text-oscuro-200">
      <template v-if="total">
        Mostrando <strong class="text-white">{{ range.from }}–{{ range.to }}</strong> de
        <strong class="text-white">{{ total }}</strong> {{ label }}
      </template>
      <template v-else>No hay {{ label }} para mostrar</template>
    </p>

    <div class="flex flex-wrap items-center gap-3">
      <label class="flex items-center gap-2 text-oscuro-200">
        <span>Por página</span>
        <select
          :value="pageSize"
          class="rounded-lg border border-oscuro-700 bg-oscuro-900/60 px-2 py-1 text-white"
          @change="emit('update:pageSize', Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="size in sizes" :key="size" :value="size">{{ size }}</option>
        </select>
      </label>

      <div v-if="pages > 1" class="flex flex-wrap items-center gap-1">
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 font-semibold text-oscuro-100 hover:bg-oscuro-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          :disabled="page <= 1"
          aria-label="Página anterior"
          @click="emit('update:page', page - 1)"
        >
          ‹ Anterior
        </button>
        <template v-for="(item, index) in items" :key="item === 'gap' ? `gap-${index}` : item">
          <span v-if="item === 'gap'" class="px-1 text-oscuro-300" aria-hidden="true">…</span>
          <button
            v-else
            type="button"
            class="min-w-[2.25rem] rounded-lg px-2.5 py-1.5 font-semibold transition"
            :class="
              item === page
                ? 'bg-green-500/15 text-green-300'
                : 'text-oscuro-100 hover:bg-oscuro-700'
            "
            :aria-current="item === page ? 'page' : undefined"
            :aria-label="`Página ${item}`"
            @click="emit('update:page', item)"
          >
            {{ item }}
          </button>
        </template>
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 font-semibold text-oscuro-100 hover:bg-oscuro-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          :disabled="page >= pages"
          aria-label="Página siguiente"
          @click="emit('update:page', page + 1)"
        >
          Siguiente ›
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { PAGE_SIZES, pageCount, pageRange, pageWindow } from '~/utils/pagination'

/** Barra de paginación de una lista del panel: rango mostrado, tamaño de página y botones de página. */
const props = withDefaults(
  defineProps<{
    page: number
    pageSize: number
    total: number
    /** Lo que se está listando, en plural («usuarios»). */
    label?: string
    sizes?: readonly number[]
  }>(),
  { label: 'elementos', sizes: () => PAGE_SIZES },
)

const emit = defineEmits<{
  'update:page': [page: number]
  'update:pageSize': [size: number]
}>()

const pages = computed(() => pageCount(props.total, props.pageSize))
const range = computed(() => pageRange(props.page, props.pageSize, props.total))
const items = computed(() => pageWindow(props.page, pages.value))
</script>
