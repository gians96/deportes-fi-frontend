// Tipos de dominio compartidos del frontend

export type Role = 'OWNER_SYSTEM' | 'ADMIN_SYSTEM' | 'REFEREE' | 'STUDENT' | 'OTHER'

export type Gender = 'M' | 'F' | 'O'

export type DisciplineModality = 'TEAM' | 'INDIVIDUAL'

export type GenderPolicy = 'MALE' | 'FEMALE' | 'MIXED' | 'FREE'

export type CompetitionFormat = 'ELIMINATION' | 'POINTS'

export type ParticipantType = 'STUDENT' | 'OTHER'

export type RegistrationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'

export type VoucherStatus = 'PENDING' | 'VALIDATED' | 'REJECTED'

/** Cómo cobra un evento: por disciplina (clásico) o por salón / ciclo completo. */
export type PricingMode = 'PER_DISCIPLINE' | 'PER_GROUP'

export type GroupScope = 'SECTION' | 'CYCLE'

/** TEAM = un solo equipo; BASE = pago general de un grupo; EXTRA = equipo adicional. */
export type VoucherKind = 'TEAM' | 'BASE' | 'EXTRA'

export type MatchStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'PLAYED'
  | 'CANCELLED'
  | 'POSTPONED'

export interface AuthUser {
  id: number
  email: string
  fullName: string
  role: Role
  isActive?: boolean
  studentCode?: string | null
  dni?: string | null
  facultyId?: number | null
  schoolId?: number | null
  avatarUrl?: string | null
}

export interface ProfessionalSchool {
  id: number
  name: string
  facultyId: number
}

export interface Faculty {
  id: number
  name: string
  acronym?: string | null
  schools?: ProfessionalSchool[]
}

export interface SportEvent {
  id: number
  name: string
  description?: string | null
  facultyId: number
  schoolId?: number | null
  startDate: string
  endDate: string
  isOpen: boolean
  pricingMode?: PricingMode
  disciplinesCount?: number
}

/** Estado calculado por el backend; `REVOKED` prevalece sobre `EXPIRED`. */
export type EventApiTokenStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED'

/** Token de integración de un evento (nunca incluye el valor completo). */
export interface EventApiToken {
  id: number
  eventId: number
  name: string
  tokenPrefix: string
  createdById?: number | null
  lastUsedAt: string | null
  expiresAt: string | null
  revokedAt: string | null
  createdAt: string
  status: EventApiTokenStatus
}

/** Respuesta de creación: único momento en que llega `token` en claro. */
export interface CreatedEventApiToken {
  id: number
  name: string
  tokenPrefix: string
  expiresAt: string | null
  createdAt: string
  token: string
}

export interface Discipline {
  id: number
  eventId: number
  name: string
  modality: DisciplineModality
  genderPolicy: GenderPolicy
  format: CompetitionFormat
  participantType: ParticipantType
  minPlayers: number
  maxPlayers: number
  maxTeams: number
  isPaid: boolean
  cost: number
  rulesText?: string | null
  extraInfo?: string | null
  registrationDeadline: string
  winPoints: number
  drawPoints: number
  lossPoints: number
  allowDraw: boolean
  matchDurationMinutes: number
  courtsCount: number
  teamsCount?: number
  event?: { id: number; name: string }
  teams?: DisciplineTeamSummary[]
}

export interface DisciplineTeamSummary {
  id: number
  name: string
  status: RegistrationStatus
  cycle?: string | null
  section?: string | null
  createdAt: string
}

export interface Participant {
  id?: number
  fullName: string
  studentCode?: string | null
  dni?: string | null
  gender: Gender
  isDelegate: boolean
  countsAsPlayer: boolean
  /** Capitán/a del equipo (eventos que cobran por salón o ciclo). */
  isCaptain?: boolean
  userId?: number | null
}

export interface TeamDisciplineEvent {
  id: number
  name: string
  faculty?: { id: number; name: string } | null
  school?: { id: number; name: string } | null
}

export interface TeamDiscipline {
  id: number
  name: string
  isPaid: boolean
  cost: number
  participantType?: ParticipantType
  minPlayers: number
  maxPlayers: number
  genderPolicy: GenderPolicy
  event: TeamDisciplineEvent
}

export interface Team {
  id: number
  name: string
  disciplineId: number
  disciplineName?: string
  discipline?: TeamDiscipline
  delegateId: number
  delegate?: Pick<AuthUser, 'id' | 'fullName' | 'email' | 'studentCode' | 'dni'>
  cycle?: string | null
  section?: string | null
  phone?: string | null
  status: RegistrationStatus
  rejectionReason?: string | null
  participants: Participant[]
  voucher?: Voucher | null
  /** Salón o ciclo que paga el equipo (null en el flujo por disciplina). */
  groupId?: number | null
  /** 1 = incluido en el pago general; 2 o más = equipo adicional. */
  slot?: number | null
  createdAt: string
}

export interface Voucher {
  id: number
  /** null en el pago general o adicional de un salón o ciclo. */
  teamId: number | null
  kind?: VoucherKind
  groupId?: number | null
  groupLabel?: string | null
  teams?: { id: number; name: string; disciplineName: string; slot: number | null; status: RegistrationStatus }[]
  teamName?: string
  cycle?: string | null
  section?: string | null
  phone?: string | null
  operationNumber: string
  amount: number
  imageUrl: string
  status: VoucherStatus
  rejectionReason?: string | null
  uploadedAt: string
  disciplineName?: string
  participantType?: ParticipantType
  minPlayers?: number
  maxPlayers?: number
  genderPolicy?: GenderPolicy
  eventName?: string
  facultyName?: string
  schoolName?: string
  participantsCount?: number
  participants?: Participant[]
}

/** Tarifas del evento (GET /events/:id/pricing). */
export interface EventPricing {
  eventId: number
  pricingMode: PricingMode
  sectionBase: number
  cycleBase: number
  sectionExtra: number
  cycleExtra: number
}

export interface GroupVoucher {
  id: number
  kind: VoucherKind
  status: VoucherStatus
  amount: number
  operationNumber: string | null
  imageUrl: string
  rejectionReason: string | null
}

export interface GroupTeam {
  id: number
  name: string
  slot: number | null
  status: RegistrationStatus
  voucherId: number | null
}

export interface GroupDiscipline {
  disciplineId: number
  name: string
  teams: GroupTeam[]
}

/** Salón o ciclo completo que paga (GET /groups). */
export interface ClassGroup {
  id: number
  eventId: number
  scope: GroupScope
  label: string
  school: { id: number; name: string }
  cycle: string
  section: string
  delegate: { id: number; fullName: string }
  baseVoucher: GroupVoucher | null
  disciplines: GroupDiscipline[]
  extraVouchers: (GroupVoucher & { teamIds: number[] })[]
}

/** Respuesta de validar un pago de grupo: equipos aprobados y omitidos con su motivo. */
export interface GroupVoucherValidation {
  id: number
  status: VoucherStatus
  approvedTeamIds: number[]
  skipped: { teamId: number; reason: string }[]
}

export interface StandingRow {
  position: number
  teamId: number
  teamName: string
  played: number
  won: number
  lost: number
  drawn: number
  points: number
  goalsFor?: number
  goalsAgainst?: number
}

export interface MatchSummary {
  id: number
  disciplineId: number
  round: number
  homeTeamId?: number | null
  homeTeamName?: string | null
  awayTeamId?: number | null
  awayTeamName?: string | null
  homeScore?: number | null
  awayScore?: number | null
  winnerTeamId?: number | null
  winnerTeamName?: string | null
  status: MatchStatus
  scheduledAt?: string | null
}

export interface FixtureTeam {
  id: number
  name: string
  cycle?: string | null
  section?: string | null
}

export interface FixtureResponse {
  discipline: Pick<
    Discipline,
    'id' | 'name' | 'format' | 'winPoints' | 'drawPoints' | 'lossPoints' | 'allowDraw'
  >
  approvedTeams: FixtureTeam[]
  standings: StandingRow[]
  matches: MatchSummary[]
}

export interface ResultsResponse {
  disciplineName: string
  format: CompetitionFormat
  scoring: {
    winPoints: number
    drawPoints: number
    lossPoints: number
    allowDraw: boolean
  }
  standings: StandingRow[]
  matches: MatchSummary[]
}

export interface AcademicStudent {
  fullName: string
  studentCode: string | null
  dni: string | null
}

export interface ScheduledMatch {
  matchId: number
  disciplineId: number
  disciplineName: string
  round: number
  homeTeamId: number
  homeTeamName: string
  awayTeamId: number
  awayTeamName: string
  slot: number
  court: number
  scheduledAt: string
}

export interface ScheduleRoundOneResponse {
  applied: boolean
  startAt: string
  slotMinutes: number
  slotsUsed: number
  totalMatches: number
  disciplines: {
    id: number
    name: string
    courtsCount: number
    matchDurationMinutes: number
  }[]
  matches: ScheduledMatch[]
}
