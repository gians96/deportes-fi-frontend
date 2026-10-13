import type {
  ClassGroup,
  EventPricing,
  GroupScope,
  GroupTeam,
  Team,
} from '~/types/domain'

/** Pago general del grupo: cubre un equipo por disciplina. */
export function baseFee(pricing: EventPricing, scope: GroupScope): number {
  return scope === 'CYCLE' ? pricing.cycleBase : pricing.sectionBase
}

/** Pago de cada equipo adicional en una misma disciplina. */
export function extraFee(pricing: EventPricing, scope: GroupScope): number {
  return scope === 'CYCLE' ? pricing.cycleExtra : pricing.sectionExtra
}

export function scopeLabel(scope: GroupScope): string {
  return scope === 'CYCLE' ? 'Ciclo completo' : 'Salón'
}

/** Etiqueta del cupo de un equipo: 1 = incluido en el pago general; 2 o más = adicional. */
export function slotLabel(slot: number | null | undefined): string {
  if (!slot) return ''
  return slot === 1 ? 'Incluido' : 'Adicional'
}

/** Equipos vigentes (con cupo) de un grupo en una disciplina. */
export function activeTeams(group: ClassGroup, disciplineId: number): GroupTeam[] {
  const discipline = group.disciplines.find((d) => d.disciplineId === disciplineId)
  return discipline?.teams.filter((team) => team.slot !== null) ?? []
}

export function isValidDni(value?: string | null): boolean {
  return /^\d{8}$/.test((value ?? '').trim())
}

/** Un equipo de un salón o ciclo se paga con el comprobante del grupo, no por disciplina. */
export function paysByGroup(team: Pick<Team, 'groupId'>): boolean {
  return team.groupId !== null && team.groupId !== undefined
}

/** Los comprobantes se sirven desde la raíz del backend, sin el prefijo /api/v1. */
export function uploadUrl(apiBase: string, path: string): string {
  if (path.startsWith('http')) return path
  return apiBase.replace(/\/api\/v1$/, '') + path
}

/** Mensaje de error del backend (`err.data.message`), con texto de respaldo. */
export function apiMessage(err: unknown, fallback: string): string {
  const message = (err as { data?: { message?: string | string[] } })?.data?.message
  if (Array.isArray(message)) return message.join('. ')
  return message || fallback
}
