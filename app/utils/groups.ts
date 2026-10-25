import type {
  ClassGroup,
  EventPricing,
  GroupScope,
  GroupTeam,
  GroupVoucher,
  RegistrationStatus,
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

/**
 * Un grupo está activo si su pago general no fue rechazado o si todavía tiene equipos pendientes o
 * aprobados (mismo criterio que el servidor). Un estudiante solo puede tener un grupo activo por evento.
 */
export function isActiveGroup(group: Pick<ClassGroup, 'baseVoucher' | 'disciplines'>): boolean {
  if (group.baseVoucher?.status !== 'REJECTED') return true
  return group.disciplines.some((discipline) =>
    discipline.teams.some(
      (team) => team.status === 'PENDING' || team.status === 'OBSERVED' || team.status === 'APPROVED',
    ),
  )
}

/** Equipo de un grupo en una lista: lo que da `GET /groups` más el detalle de `GET /registrations` si se cargó. */
export interface GroupTeamRow {
  id: number
  name: string
  discipline: string
  status: RegistrationStatus
  voucherId: number | null
  detail?: Team
}

export function groupTeamRows(group: ClassGroup, teamsById: Map<number, Team>): GroupTeamRow[] {
  return group.disciplines.flatMap((discipline) =>
    discipline.teams.map((team) => ({
      id: team.id,
      name: team.name,
      discipline: discipline.name,
      status: team.status,
      voucherId: team.voucherId,
      detail: teamsById.get(team.id),
    })),
  )
}

/** Comprobante que cubre a un equipo del grupo y cómo se llama esa cobertura (pack o adicional). */
export function coverageOf(
  group: ClassGroup,
  teamId: number,
): { voucher: GroupVoucher; label: string } | null {
  const team = group.disciplines.flatMap((discipline) => discipline.teams).find((t) => t.id === teamId)
  if (!team || team.voucherId === null) return null
  if (group.baseVoucher && team.voucherId === group.baseVoucher.id) {
    return { voucher: group.baseVoucher, label: group.scope === 'CYCLE' ? 'Pack del ciclo' : 'Pack del salón' }
  }
  const extra = group.extraVouchers.find((voucher) => voucher.id === team.voucherId)
  return extra ? { voucher: extra, label: 'Equipo adicional' } : null
}

export type GroupAttention = 'PENDING' | 'REJECTED' | 'OBSERVED' | 'DRAFT' | 'OK'

/** Orden de la lista de salones: primero lo que pide una acción del administrador. */
export const ATTENTION_ORDER: Record<GroupAttention, number> = {
  PENDING: 0,
  REJECTED: 1,
  OBSERVED: 2,
  DRAFT: 3,
  OK: 4,
}

/**
 * Qué necesita un salón o ciclo: algo por revisar (equipo o pago pendiente), un pago rechazado o un equipo
 * observado (esperan al delegado), solo borradores sin enviar, o nada (al día). Ordena la lista y da el aviso de la cabecera.
 */
export function groupAttention(
  group: Pick<ClassGroup, 'baseVoucher' | 'extraVouchers' | 'disciplines'>,
): GroupAttention {
  const teams = group.disciplines.flatMap((discipline) => discipline.teams)
  const vouchers = [group.baseVoucher, ...group.extraVouchers].filter(
    (voucher): voucher is NonNullable<typeof voucher> => !!voucher,
  )
  if (teams.some((team) => team.status === 'PENDING') || vouchers.some((v) => v.status === 'PENDING')) {
    return 'PENDING'
  }
  if (vouchers.some((voucher) => voucher.status === 'REJECTED')) return 'REJECTED'
  if (teams.some((team) => team.status === 'OBSERVED')) return 'OBSERVED'
  if (teams.some((team) => team.status === 'DRAFT')) return 'DRAFT'
  return 'OK'
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
