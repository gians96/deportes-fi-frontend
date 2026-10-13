<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>

<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

ChartJS.register(Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps<{
  labels: string[]
  series: Array<{ label: string; data: number[]; color: string }>
}>()

const chartData = computed(() => ({
  labels: props.labels,
  datasets: props.series.map((serie) => ({
    label: serie.label,
    data: serie.data,
    backgroundColor: serie.color,
    borderRadius: 4,
  })),
}))

// Barras apiladas: cada día muestra cuántas consultas hubo y con qué resultado.
const chartOptions = {
  responsive: true,
  plugins: { legend: { labels: { color: '#a3aab0' } } },
  scales: {
    x: { stacked: true, ticks: { color: '#77808a' }, grid: { color: '#151d24' } },
    y: {
      stacked: true,
      beginAtZero: true,
      ticks: { color: '#77808a', precision: 0 },
      grid: { color: '#151d24' },
    },
  },
}
</script>
