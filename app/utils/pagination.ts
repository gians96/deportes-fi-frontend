/** Tamaños de página que ofrecen las listas del panel. */
export const PAGE_SIZES = [10, 25, 50, 100] as const

/** Un botón de página o un hueco («…») entre páginas no mostradas. */
export type PageItem = number | 'gap'

/** Cantidad de páginas (mínimo 1, aunque no haya elementos). */
export function pageCount(total: number, size: number): number {
  return Math.max(1, Math.ceil(total / Math.max(1, size)))
}

/** Lleva `page` al rango válido [1, última página]; un valor no numérico vale 1. */
export function clampPage(page: number, total: number, size: number): number {
  const wanted = Number.isFinite(page) ? Math.floor(page) : 1
  return Math.min(Math.max(1, wanted), pageCount(total, size))
}

/** Rango mostrado, de 1 en adelante y con ambos extremos incluidos; `{ from: 0, to: 0 }` si no hay elementos. */
export function pageRange(page: number, size: number, total: number): { from: number; to: number } {
  if (total <= 0) return { from: 0, to: 0 }
  const from = (page - 1) * size + 1
  return { from, to: Math.min(total, page * size) }
}

/**
 * Botones de página a mostrar: siempre la primera, la última y las vecinas de la actual; un hueco («…»)
 * donde faltan dos o más páginas, y el número mismo cuando falta solo una (así nunca hay un «…» de una página).
 */
export function pageWindow(current: number, last: number, siblings = 1): PageItem[] {
  if (last <= 1) return [1]
  const wanted = new Set<number>([1, last])
  for (let p = current - siblings; p <= current + siblings; p++) {
    if (p >= 1 && p <= last) wanted.add(p)
  }
  const sorted = [...wanted].sort((a, b) => a - b)
  const items: PageItem[] = []
  sorted.forEach((p, i) => {
    const previous = sorted[i - 1]
    if (previous !== undefined) {
      if (p - previous === 2) items.push(previous + 1)
      else if (p - previous > 2) items.push('gap')
    }
    items.push(p)
  })
  return items
}
