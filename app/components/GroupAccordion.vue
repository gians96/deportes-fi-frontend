<template>
  <article class="rounded-3xl border border-oscuro-700 bg-oscuro-850 p-4">
    <button
      type="button"
      class="flex w-full items-start gap-3 text-left"
      :aria-expanded="open"
      :aria-controls="bodyId"
      @click="emit('toggle')"
    >
      <ChevronRight
        class="mt-1 h-5 w-5 shrink-0 text-oscuro-200 transition-transform"
        :class="open ? 'rotate-90' : ''"
      />
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span class="text-xs font-semibold uppercase tracking-normal text-green-300">
            {{ scopeLabel(group.scope) }}
          </span>
          <h2 class="text-lg font-bold text-white">{{ group.label }}</h2>
        </div>
        <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span class="rounded-lg bg-oscuro-900/70 px-2.5 py-1 font-semibold text-white">
            {{ cycleSectionLabel }}
          </span>
          <span class="text-oscuro-200">
            {{ plural(counts.total, 'equipo', 'equipos') }} ·
            {{ plural(counts.approved, 'aprobado', 'aprobados') }} ·
            {{ plural(counts.pending, 'pendiente', 'pendientes') }}
            <template v-if="counts.observed">
              · <span class="text-orange-300">{{ plural(counts.observed, 'observado', 'observados') }}</span>
            </template>
          </span>
        </div>
        <p class="mt-1.5 text-xs text-oscuro-300">
          Pagos {{ formatCurrency(money.total) }} (cada voucher una sola vez) ·
          <span class="text-green-300">validado {{ formatCurrency(money.validated) }}</span> ·
          <span class="text-yellow-300">por validar {{ formatCurrency(money.pending) }}</span>
          <template v-if="money.rejected">
            · <span class="text-red-300">rechazado {{ formatCurrency(money.rejected) }}</span>
          </template>
        </p>
      </div>
      <span
        class="mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
        :class="attentionView.classes"
      >
        <span class="h-1.5 w-1.5 rounded-full" :class="attentionView.dot" />
        {{ attentionView.label }}
      </span>
    </button>

    <div v-if="open" :id="bodyId" class="mt-4 space-y-4 border-t border-oscuro-700 pt-4">
      <p class="flex flex-wrap items-center gap-2 text-xs">
        <span class="rounded-lg bg-green-500/10 px-2.5 py-1 text-green-300">
          Delegado: {{ group.delegate.fullName }}
        </span>
        <span v-if="phone" class="rounded-lg bg-oscuro-900/70 px-2.5 py-1 text-oscuro-100">Tel: {{ phone }}</span>
      </p>

      <section
        v-for="section in sections"
        :key="section.key"
        class="rounded-2xl border p-4"
        :class="section.box"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="flex items-center gap-2 text-sm font-bold" :class="section.titleColor">
              <component :is="section.icon" class="h-4 w-4 shrink-0" />
              {{ section.title }}
            </p>
            <p class="mt-0.5 text-xs text-oscuro-300">{{ section.subtitle }}</p>
          </div>
          <div v-if="section.voucher" class="flex flex-wrap items-center gap-3">
            <span class="text-sm font-semibold text-green-400">
              {{ formatCurrency(Number(section.voucher.amount)) }}
            </span>
            <span class="text-xs text-oscuro-200">N° {{ section.voucher.operationNumber || '—' }}</span>
            <StatusBadge :status="section.voucher.status" />
            <button
              type="button"
              class="rounded-lg bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300 hover:bg-green-500/25"
              @click="emit('review-payment', section.voucher.id)"
            >
              {{ section.voucher.status === 'PENDING' ? 'Revisar y validar pago' : 'Revisar pago' }}
            </button>
          </div>
        </div>
        <p v-if="!section.voucher && section.key === 'pack'" class="mt-2 text-xs text-oscuro-300">
          El grupo todavía no tiene comprobante del pago general.
        </p>

        <ul class="mt-3 space-y-1.5">
          <li
            v-for="row in section.rows"
            :key="row.id"
            class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-oscuro-900/60 px-3 py-2"
          >
            <div class="min-w-0">
              <p class="truncate text-sm text-oscuro-100">
                <span class="font-semibold text-white">{{ row.discipline }}</span> · {{ row.name }}
              </p>
              <p v-if="row.detail" class="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-oscuro-300">
                <span>{{ playersOf(row.detail) }} jugadores</span>
                <span
                  v-if="rulesOf(row.detail).ok"
                  class="rounded-md bg-green-500/10 px-1.5 py-0.5 text-green-300"
                >
                  Cumple las bases
                </span>
                <span
                  v-else
                  class="rounded-md bg-red-500/10 px-1.5 py-0.5 text-red-300"
                  :title="rulesOf(row.detail).messages.join(' ')"
                >
                  Revisar bases: {{ rulesOf(row.detail).messages[0] }}
                </span>
              </p>
            </div>
            <div class="flex items-center gap-2">
              <StatusBadge :status="row.status" />
              <button
                v-if="row.detail"
                type="button"
                class="rounded-lg bg-oscuro-700/60 px-3 py-1 text-xs font-semibold text-oscuro-100 hover:bg-oscuro-700"
                @click="emit('review-team', row.detail)"
              >
                Revisar
              </button>
            </div>
          </li>
          <li v-if="!section.rows.length" class="px-1 text-xs text-oscuro-300">Todavía no cubre ningún equipo.</li>
        </ul>
      </section>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ChevronRight, Package, Plus, Users } from 'lucide-vue-next'
import type { ClassGroup, GroupVoucher, Team } from '~/types/domain'
import { formatCurrency } from '~/utils/format'
import {
  groupAttention,
  groupTeamRows,
  scopeLabel,
  slotLabel,
  type GroupAttention,
  type GroupTeamRow,
} from '~/utils/groups'

/**
 * Un salón o ciclo como desplegable. Cerrado, una línea con su estado ("1 por revisar", "Al día"…) para ir
 * revisando uno por uno; abierto, su pago general con los equipos que cubre y, aparte, cada equipo adicional
 * con su comprobante. Los datos de cada equipo y de cada pago se revisan en el modal, no aquí.
 */
const props = defineProps<{
  group: ClassGroup
  /** Equipos que la pantalla cargó (ya con sus filtros), por id. */
  teamsById: Map<number, Team>
  playersOf: (team: Team) => number
  rulesOf: (team: Team) => { ok: boolean; messages: string[] }
  open: boolean
}>()

const emit = defineEmits<{
  toggle: []
  'review-team': [team: Team]
  'review-payment': [voucherId: number]
}>()

interface Section {
  key: string
  title: string
  subtitle: string
  icon: typeof Package
  box: string
  titleColor: string
  voucher: GroupVoucher | null
  rows: GroupTeamRow[]
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

const bodyId = computed(() => `grupo-${props.group.id}`)
const rows = computed(() => groupTeamRows(props.group, props.teamsById))

const cycleSectionLabel = computed(() =>
  props.group.scope === 'CYCLE'
    ? `Ciclo ${props.group.cycle} · todas las secciones`
    : `Ciclo ${props.group.cycle} · Sección ${props.group.section}`,
)

const phone = computed(() => rows.value.map((row) => row.detail?.phone?.trim()).find(Boolean) ?? '')

const counts = computed(() => {
  const sent = rows.value.filter((row) => row.status !== 'DRAFT')
  return {
    total: sent.length,
    approved: sent.filter((row) => row.status === 'APPROVED').length,
    pending: sent.filter((row) => row.status === 'PENDING').length,
    observed: sent.filter((row) => row.status === 'OBSERVED').length,
  }
})

/** Cada comprobante se suma una sola vez, sin importar cuántos equipos cubra. */
const money = computed(() => {
  const vouchers = [props.group.baseVoucher, ...props.group.extraVouchers].filter(
    (voucher): voucher is GroupVoucher => !!voucher,
  )
  const sum = (status?: string) =>
    vouchers
      .filter((voucher) => !status || voucher.status === status)
      .reduce((total, voucher) => total + Number(voucher.amount), 0)
  return { total: sum(), validated: sum('VALIDATED'), pending: sum('PENDING'), rejected: sum('REJECTED') }
})

const ATTENTION: Record<GroupAttention, { classes: string; dot: string }> = {
  PENDING: { classes: 'border-yellow-500/25 bg-yellow-500/10 text-yellow-300', dot: 'bg-yellow-400' },
  REJECTED: { classes: 'border-red-500/25 bg-red-500/10 text-red-300', dot: 'bg-red-400' },
  OBSERVED: { classes: 'border-orange-500/25 bg-orange-500/10 text-orange-300', dot: 'bg-orange-400' },
  DRAFT: { classes: 'border-sky-500/25 bg-sky-500/10 text-sky-300', dot: 'bg-sky-400' },
  OK: { classes: 'border-green-500/25 bg-green-500/10 text-green-300', dot: 'bg-green-400' },
}

const attentionView = computed(() => {
  const kind = groupAttention(props.group)
  const label = {
    PENDING: counts.value.pending ? `${counts.value.pending} por revisar` : 'Pago por validar',
    REJECTED: 'Pago rechazado',
    OBSERVED: 'Esperando al delegado',
    DRAFT: 'Solo borradores',
    OK: 'Al día',
  }[kind]
  return { ...ATTENTION[kind], label }
})

const sections = computed<Section[]>(() => {
  const result: Section[] = []
  const base = props.group.baseVoucher
  const packRows = rows.value.filter((row) => base && row.voucherId === base.id)

  result.push({
    key: 'pack',
    title: props.group.scope === 'CYCLE' ? 'Pack del ciclo' : 'Pack del salón',
    subtitle: 'Pago general: un solo voucher para un equipo por disciplina',
    icon: Package,
    box: 'border-green-500/25 bg-green-500/5',
    titleColor: 'text-green-300',
    voucher: base,
    rows: packRows,
  })

  const covered = new Set(packRows.map((row) => row.id))
  for (const extra of props.group.extraVouchers) {
    const extraRows = rows.value.filter((row) => extra.teamIds.includes(row.id))
    extraRows.forEach((row) => covered.add(row.id))
    result.push({
      key: `extra-${extra.id}`,
      title: 'Equipo adicional',
      subtitle: `${slotLabel(2)} al pack · ${cycleSectionLabel.value} · comprobante propio`,
      icon: Plus,
      box: 'border-amber-500/30 bg-amber-500/5',
      titleColor: 'text-amber-300',
      voucher: extra,
      rows: extraRows,
    })
  }

  const others = rows.value.filter((row) => !covered.has(row.id))
  if (others.length) {
    result.push({
      key: 'others',
      title: 'Otros equipos',
      subtitle: 'Sin un pago vigente que los cubra (por ejemplo, rechazados o cancelados)',
      icon: Users,
      box: 'border-oscuro-700 bg-oscuro-900/40',
      titleColor: 'text-oscuro-100',
      voucher: null,
      rows: others,
    })
  }
  return result
})
</script>
