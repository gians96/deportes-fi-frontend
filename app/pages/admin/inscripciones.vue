<template>
  <div>
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-white">Inscripciones</h1>
        <p class="mt-1 text-sm text-oscuro-300">
          Gestiona equipos gratuitos y de pago desde una sola pantalla.
        </p>
      </div>
      <button
        class="shrink-0 rounded-lg bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300 hover:bg-green-500/20"
        @click="openCreate"
      >
        Crear equipo
      </button>
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <button
        v-for="option in filters"
        :key="option.value"
        class="rounded-lg px-3 py-1.5 text-sm font-semibold transition"
        :class="
          filter === option.value
            ? 'bg-green-500/15 text-green-300'
            : 'bg-oscuro-850 text-oscuro-300 hover:bg-oscuro-800'
        "
        @click="filter = option.value"
      >
        {{ option.label }}
      </button>
    </div>

    <div class="mt-3 flex flex-wrap gap-2">
      <button
        v-for="option in paymentFilters"
        :key="option.value"
        class="rounded-lg px-3 py-1.5 text-sm font-semibold transition"
        :class="
          paymentFilter === option.value
            ? 'bg-sky-500/15 text-sky-300'
            : 'bg-oscuro-850 text-oscuro-300 hover:bg-oscuro-800'
        "
        @click="paymentFilter = option.value"
      >
        {{ option.label }}
      </button>
    </div>

    <div class="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <label class="block">
        <span class="text-xs text-oscuro-400">Evento</span>
        <select v-model.number="adv.eventId" class="input">
          <option :value="0">Todos</option>
          <option v-for="event in events" :key="event.id" :value="event.id">
            {{ event.name }}
          </option>
        </select>
      </label>
      <label class="block">
        <span class="text-xs text-oscuro-400">Facultad</span>
        <select v-model.number="adv.facultyId" class="input">
          <option :value="0">Todas</option>
          <option v-for="faculty in faculties" :key="faculty.id" :value="faculty.id">
            {{ faculty.name }}
          </option>
        </select>
      </label>
      <label class="block">
        <span class="text-xs text-oscuro-400">Escuela profesional</span>
        <select v-model.number="adv.schoolId" class="input">
          <option :value="0">Todas</option>
          <option v-for="school in filterSchools" :key="school.id" :value="school.id">
            {{ school.name }}
          </option>
        </select>
      </label>
      <label class="block">
        <span class="text-xs text-oscuro-400">Disciplina</span>
        <select v-model.number="adv.disciplineId" class="input">
          <option :value="0">Todas</option>
          <option v-for="discipline in disciplines" :key="discipline.id" :value="discipline.id">
            {{ discipline.name }}
          </option>
        </select>
      </label>
      <label class="block">
        <span class="text-xs text-oscuro-400">Tipo de participante</span>
        <select v-model="adv.participantType" class="input">
          <option value="ALL">Todos</option>
          <option value="STUDENT">Solo estudiantes</option>
          <option value="OTHER">Otros</option>
        </select>
      </label>
    </div>

    <p v-if="!filtered.length" class="mt-8 text-center text-sm text-oscuro-400">
      No hay equipos que coincidan con los filtros.
    </p>

    <div class="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="team in filtered"
        :key="team.id"
        class="flex flex-col rounded-3xl border border-oscuro-700 bg-oscuro-850 p-5 transition-all hover:border-green-700/40 hover:shadow-2xl hover:shadow-green-900/10"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-start gap-3">
            <span
              class="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              :class="getSportMeta(team.discipline?.name).bg"
            >
              <component
                :is="getSportMeta(team.discipline?.name).icon"
                class="h-6 w-6"
                :class="getSportMeta(team.discipline?.name).color"
              />
            </span>
            <div class="min-w-0">
              <p class="truncate text-lg font-bold text-white">{{ team.name }}</p>
              <p class="truncate text-xs text-oscuro-400">
                {{ team.discipline?.name || team.disciplineName }}
              </p>
            </div>
          </div>
          <StatusBadge :status="team.status" />
        </div>

        <div class="mt-4 space-y-1.5 text-xs text-oscuro-300">
          <p class="flex items-center gap-2">
            <CalendarRange class="h-3.5 w-3.5 text-oscuro-500" />
            <span class="truncate">{{ team.discipline?.event?.name || 'â€”' }}</span>
          </p>
          <p class="flex items-center gap-2">
            <Building2 class="h-3.5 w-3.5 text-oscuro-500" />
            <span class="truncate">{{ team.discipline?.event?.faculty?.name || 'â€”' }}</span>
          </p>
          <p class="flex items-center gap-2">
            <GraduationCap class="h-3.5 w-3.5 text-oscuro-500" />
            <span class="truncate">{{ team.discipline?.event?.school?.name || 'Todas las escuelas' }}</span>
          </p>
        </div>

        <div class="my-5 flex items-center justify-between gap-4">
          <div class="text-center">
            <p class="text-xs text-green-400">Participantes</p>
            <p class="text-4xl font-bold text-green-400">
              {{ countedPlayers(team) }}
            </p>
            <p class="text-[11px] text-oscuro-500">
              {{ team.participants.length }} registrados
            </p>
          </div>
          <div class="h-14 w-px bg-oscuro-700" />
          <div class="flex-1 text-center">
            <p class="text-xs text-oscuro-400">Validación de reglas</p>
            <p
              class="mt-1 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
              :class="
                rulesCheck(team).ok
                  ? 'bg-green-500/10 text-green-300'
                  : 'bg-red-500/10 text-red-300'
              "
            >
              <component :is="rulesCheck(team).ok ? CheckCircle2 : AlertTriangle" class="h-3.5 w-3.5" />
              {{ rulesCheck(team).ok ? 'Cumple' : 'Revisar' }}
            </p>
          </div>
        </div>

        <div v-if="team.discipline" class="mb-3 flex flex-wrap gap-2 text-xs">
          <span
            v-if="team.delegate"
            class="rounded-lg bg-green-500/10 px-2.5 py-1 text-green-300"
          >
            Delegado: {{ team.delegate.fullName }}
          </span>
          <span class="rounded-lg bg-oscuro-900/70 px-2.5 py-1 text-oscuro-300">
            Tel: {{ teamPhoneLabel(team) }}
          </span>
          <span class="rounded-lg bg-oscuro-900/70 px-2.5 py-1 text-oscuro-300">
            {{ participantTypeLabel(team.discipline.participantType) }}
          </span>
          <span
            class="rounded-lg px-2.5 py-1"
            :class="
              needsVoucher(team)
                ? 'bg-yellow-500/10 text-yellow-300'
                : 'bg-green-500/10 text-green-300'
            "
          >
            {{ needsVoucher(team) ? voucherBadge(team) : 'Gratuito' }}
          </span>
          <span class="rounded-lg bg-oscuro-900/70 px-2.5 py-1 text-oscuro-300">
            Base: {{ team.discipline.minPlayers }}-{{ team.discipline.maxPlayers }}
          </span>
          <span
            v-if="team.discipline.participantType === 'STUDENT'"
            class="rounded-lg bg-oscuro-900/70 px-2.5 py-1 font-semibold text-white"
          >
            Ciclo - Sección: {{ teamCycleSection(team) }}
          </span>
        </div>

        <ul
          v-if="rulesCheck(team).messages.length"
          class="mb-3 space-y-1 rounded-lg bg-red-500/5 px-3 py-2 text-xs text-red-300"
        >
          <li v-for="message in rulesCheck(team).messages" :key="message" class="flex items-center gap-1.5">
            <AlertTriangle class="h-3 w-3 shrink-0" />
            {{ message }}
          </li>
        </ul>

        <button
          class="mt-auto flex w-full items-center justify-between rounded-2xl border border-oscuro-700 bg-oscuro-900/50 px-4 py-2.5 text-sm font-semibold text-oscuro-300 transition-all hover:border-green-500/40 hover:text-green-300"
          @click="openReview(team)"
        >
          <span class="flex items-center gap-2">
            <component :is="needsVoucher(team) ? ReceiptText : Users" class="h-4 w-4" />
            {{ needsVoucher(team) ? 'Revisar voucher' : 'Revisar equipo' }}
          </span>
          <ChevronRight class="h-4 w-4" />
        </button>

        <p
          v-if="team.status === 'REJECTED' && team.rejectionReason"
          class="mt-3 rounded-lg bg-red-500/5 px-3 py-2 text-xs text-red-300"
        >
          Motivo: {{ team.rejectionReason }}
        </p>
      </article>
    </div>

    <AppModal v-model="reviewOpen" :title="reviewTeam?.name || 'Revisar equipo'" size="4xl">
      <div v-if="reviewTeam" class="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <div class="space-y-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-normal text-green-300">
                {{ reviewTeam.discipline?.event?.name || 'Evento' }}
              </p>
              <h2 class="mt-1 text-2xl font-bold text-white">{{ reviewTeam.name }}</h2>
              <p class="mt-1 text-sm text-oscuro-400">
                {{ reviewTeam.discipline?.name || reviewTeam.disciplineName || 'Disciplina' }}
              </p>
            </div>
            <StatusBadge :status="reviewTeam.status" />
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            <div class="rounded-xl bg-oscuro-900/60 p-3">
              <p class="text-xs text-oscuro-400">Delegado</p>
              <p class="mt-1 truncate text-sm font-semibold text-white">
                {{ reviewTeam.delegate?.fullName || 'Responsable registrado' }}
              </p>
              <p class="mt-1 truncate text-xs text-oscuro-400">
                {{ reviewTeam.delegate?.email || '—' }}
              </p>
            </div>
            <div class="rounded-xl bg-oscuro-900/60 p-3">
              <p class="text-xs text-oscuro-400">Teléfono de contacto</p>
              <p class="mt-1 truncate text-sm font-semibold text-white">
                {{ teamPhoneLabel(reviewTeam) }}
              </p>
            </div>
            <div class="rounded-xl bg-oscuro-900/60 p-3">
              <p class="text-xs text-oscuro-400">Ciclo - sección</p>
              <p class="mt-1 text-sm font-semibold text-white">
                {{ teamCycleSection(reviewTeam) }}
              </p>
            </div>
          </div>

          <div
            class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold"
            :class="reviewRules.ok ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'"
          >
            <component :is="reviewRules.ok ? CheckCircle2 : AlertTriangle" class="h-4 w-4" />
            {{ reviewRules.ok ? 'El equipo cumple las bases' : 'El equipo necesita revisiÃ³n' }}
          </div>
          <ul v-if="reviewRules.messages.length" class="space-y-1 rounded-xl bg-red-500/5 p-3 text-xs text-red-300">
            <li v-for="message in reviewRules.messages" :key="message" class="flex items-center gap-1.5">
              <AlertTriangle class="h-3 w-3 shrink-0" />
              {{ message }}
            </li>
          </ul>

          <div class="rounded-xl border border-oscuro-700">
            <button
              type="button"
              class="flex w-full items-center justify-between border-b border-oscuro-700 px-4 py-3 text-left"
              @click="reviewPlayersOpen = !reviewPlayersOpen"
            >
              <p class="font-semibold text-white">Jugadores</p>
              <span class="flex items-center gap-2 text-xs text-oscuro-400">
                {{ reviewTeam.participants.length }}
                <ChevronRight
                  class="h-4 w-4 transition-transform"
                  :class="reviewPlayersOpen ? 'rotate-90' : ''"
                />
              </span>
            </button>
            <ul v-if="reviewPlayersOpen" class="p-2 text-sm">
              <li
                v-for="(participant, index) in reviewTeam.participants"
                :key="participant.studentCode || participant.dni || participant.fullName"
                class="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/5"
              >
                <span class="min-w-0 truncate text-oscuro-100">
                  {{ index + 1 }}. {{ participant.fullName }}
                </span>
                <span class="shrink-0 font-mono text-xs text-oscuro-400">
                  {{ participant.studentCode || participant.dni || 'â€”' }}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div class="space-y-4">
          <div
            v-if="needsVoucher(reviewTeam)"
            class="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4"
          >
            <div class="flex items-center justify-between gap-3">
              <h3 class="font-bold text-amber-300">Comprobante de pago</h3>
              <StatusBadge v-if="reviewTeam.voucher" :status="reviewTeam.voucher.status" />
            </div>

            <template v-if="reviewTeam.voucher">
              <div class="mt-4 grid gap-3 sm:grid-cols-2">
                <div class="rounded-xl bg-oscuro-900/60 p-3">
                  <p class="text-xs text-oscuro-400">Monto</p>
                  <p class="font-semibold text-green-400">
                    {{ formatCurrency(reviewTeam.voucher.amount) }}
                  </p>
                </div>
                <div class="rounded-xl bg-oscuro-900/60 p-3">
                  <p class="text-xs text-oscuro-400">NÂ° operaciÃ³n</p>
                  <p class="truncate font-semibold text-white">
                    {{ reviewTeam.voucher.operationNumber || 'â€”' }}
                  </p>
                </div>
              </div>

              <div
                v-if="reviewTeam.voucher.imageUrl"
                class="mt-4 block overflow-hidden rounded-2xl border border-oscuro-700 bg-black"
              >
                <img
                  :src="resolveUrl(reviewTeam.voucher.imageUrl)"
                  alt="voucher"
                  class="max-h-80 w-full object-contain"
                />
              </div>

              <p
                v-if="reviewTeam.voucher.status === 'REJECTED' && reviewTeam.voucher.rejectionReason"
                class="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300"
              >
                Voucher rechazado: {{ reviewTeam.voucher.rejectionReason }}
              </p>
            </template>

            <p v-else class="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
              Este equipo de pago no tiene voucher adjunto.
            </p>
          </div>

          <div v-else class="rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
            <h3 class="font-bold text-green-300">Inscripción gratuita</h3>
            <p class="mt-1 text-sm text-oscuro-300">
              Solo requiere validar que el equipo cumpla las bases.
            </p>
          </div>

          <p
            v-if="reviewTeam.status === 'REJECTED' && reviewTeam.rejectionReason"
            class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300"
          >
            InscripciÃ³n rechazada: {{ reviewTeam.rejectionReason }}
          </p>
        </div>
      </div>

      <template v-if="reviewTeam && reviewTeam.status === 'PENDING'" #footer>
        <div class="grid gap-3">
          <div
            v-if="needsVoucher(reviewTeam) && reviewTeam.voucher?.status === 'PENDING'"
            class="grid gap-2 sm:grid-cols-[1fr_auto_auto]"
          >
            <input
              v-model="registrationRejectReason"
              placeholder="Motivo de rechazo de inscripción"
              class="min-w-0 rounded-lg border border-oscuro-700 bg-oscuro-900/60 px-3 py-2 text-sm text-white"
            />
            <button
              class="rounded-lg bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/25"
              @click="rejectReview"
            >
              Rechazar inscripción
            </button>
            <button
              class="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-oscuro-900 hover:bg-green-400 disabled:opacity-50"
              :disabled="!reviewRules.ok"
              @click="validateVoucher"
            >
              {{ reviewTeam.groupId ? 'Validar pago del salón y aprobar equipos' : 'Validar voucher y aprobar' }}
            </button>
          </div>

          <button
            v-else-if="!needsVoucher(reviewTeam) || reviewTeam.voucher?.status === 'VALIDATED'"
            class="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-oscuro-900 hover:bg-green-400 disabled:opacity-50"
            :disabled="!reviewRules.ok"
            @click="approveReview"
          >
            Aprobar inscripción
          </button>

          <div
            v-if="!(needsVoucher(reviewTeam) && reviewTeam.voucher?.status === 'PENDING')"
            class="grid gap-2 sm:grid-cols-[1fr_auto]"
          >
            <input
              v-model="registrationRejectReason"
              placeholder="Motivo de rechazo de inscripción"
              class="min-w-0 rounded-lg border border-oscuro-700 bg-oscuro-900/60 px-3 py-2 text-sm text-white"
            />
            <button
              class="rounded-lg bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/25"
              @click="rejectReview"
            >
              Rechazar inscripción
            </button>
          </div>
        </div>
      </template>
    </AppModal>

    <AppModal v-model="createOpen" title="Crear equipo manualmente">
      <form class="grid gap-4" @submit.prevent="submitCreate">
        <label class="block">
          <span class="text-sm text-oscuro-200">Disciplina</span>
          <select v-model.number="createForm.disciplineId" required class="input">
            <option :value="0" disabled>Selecciona...</option>
            <option v-for="discipline in disciplines" :key="discipline.id" :value="discipline.id">
              {{ discipline.name }} Â·
              {{ discipline.participantType === 'OTHER' ? 'Otros' : 'Solo estudiantes' }}
              Â· {{ discipline.isPaid ? formatCurrency(discipline.cost) : 'Gratuito' }}
              <template v-if="discipline.event"> Â· {{ discipline.event.name }}</template>
            </option>
          </select>
          <span v-if="!disciplines.length" class="mt-1 block text-xs text-amber-400">
            No hay disciplinas activas para el filtro seleccionado.
          </span>
        </label>

        <label class="block">
          <span class="text-sm text-oscuro-200">Nombre del equipo</span>
          <input v-model="createForm.teamName" required class="input" />
        </label>

        <label class="block">
          <span class="text-sm text-oscuro-200">TelÃ©fono (opcional)</span>
          <input v-model="createForm.phone" class="input" />
        </label>

        <label class="block">
          <span class="text-sm text-oscuro-200">Delegado responsable</span>
          <select v-model.number="createForm.delegateId" required class="input">
            <option :value="0" disabled>Selecciona un usuario</option>
            <option v-for="user in delegateOptions" :key="user.id" :value="user.id">
              {{ user.fullName }} Â· {{ user.email }}
            </option>
          </select>
          <span class="mt-1 block text-xs text-oscuro-400">
            Esta persona podrÃ¡ ver y gestionar la inscripciÃ³n.
          </span>
        </label>

        <div v-if="participantMode === 'STUDENT'" class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm text-oscuro-200">Ciclo</span>
            <input v-model="createForm.cycle" class="input" placeholder="Ej. VIII" />
          </label>
          <label class="block">
            <span class="text-sm text-oscuro-200">SecciÃ³n</span>
            <input v-model="createForm.section" class="input" placeholder="Ej. A" />
          </label>
        </div>

        <div class="rounded-lg border border-oscuro-700 p-3">
          <span class="text-sm font-semibold text-oscuro-200">Integrantes</span>
          <p class="mt-1 text-xs text-oscuro-400">
            {{
              participantMode === 'OTHER'
                ? 'Busca por DNI (8 dÃ­gitos) en RENIEC.'
                : 'Busca por cÃ³digo de estudiante en el padrÃ³n.'
            }}
            El delegado responsable se elige aparte y no cuenta como jugador.
          </p>
          <p v-if="selectedDiscipline" class="mt-1 text-xs text-green-300">
            Jugadores para bases: {{ createCountedPlayers }} /
            {{ selectedDiscipline.minPlayers }}-{{ selectedDiscipline.maxPlayers }}
          </p>
          <div class="mt-2 flex gap-2">
            <input
              v-model="participantSearch"
              :placeholder="participantMode === 'OTHER' ? 'DNI (8 dÃ­gitos)' : 'CÃ³digo de estudiante'"
              :inputmode="participantMode === 'OTHER' ? 'numeric' : 'text'"
              class="input flex-1"
              @keydown.enter.prevent="searchParticipant"
            />
            <button
              type="button"
              class="rounded-lg bg-green-500/15 px-3 text-sm font-semibold text-green-300 hover:bg-green-500/25"
              :disabled="searching"
              @click="searchParticipant"
            >
              Agregar
            </button>
          </div>
          <p v-if="participantError" class="mt-1 text-xs text-red-400">{{ participantError }}</p>
          <ul v-if="createForm.participants.length" class="mt-2 space-y-1">
            <li
              v-for="(participant, index) in createForm.participants"
              :key="participant.studentCode || participant.dni || participant.fullName"
              class="flex items-center justify-between rounded px-2 py-1 text-sm text-oscuro-200"
            >
              <span>
                {{ participant.fullName }}
                <span class="text-xs text-oscuro-400">
                  Â· {{ participant.studentCode || participant.dni || 's/d' }}
                </span>
              </span>
              <button
                type="button"
                class="text-xs text-red-400 hover:text-red-300"
                @click="removeParticipant(index)"
              >
                Quitar
              </button>
            </li>
          </ul>
        </div>

        <div
          v-if="selectedDiscipline?.isPaid"
          class="grid gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"
        >
          <span class="text-sm font-semibold text-amber-300">
            Comprobante de pago ({{ formatCurrency(selectedDiscipline.cost) }})
          </span>
          <label class="block">
            <span class="text-xs text-oscuro-300">NÂ° de operaciÃ³n</span>
            <input v-model="createForm.operationNumber" class="input" />
          </label>
          <label class="block">
            <span class="text-xs text-oscuro-300">Imagen del voucher</span>
            <input type="file" accept="image/*" class="input" @change="onVoucher" />
          </label>
        </div>

        <p v-if="modalError" class="text-sm text-red-400">{{ modalError }}</p>
        <button
          type="submit"
          class="rounded-lg bg-green-500 px-5 py-2.5 font-semibold text-oscuro-900 hover:bg-green-400 disabled:opacity-50"
          :disabled="submitting"
        >
          {{ submitting ? 'Creando...' : 'Crear equipo' }}
        </button>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import {
  AlertTriangle,
  Building2,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  ReceiptText,
  Users,
} from 'lucide-vue-next'
import type {
  AcademicStudent,
  AuthUser,
  Discipline,
  Participant,
  ParticipantType,
  RegistrationStatus,
  SportEvent,
  Team,
} from '~/types/domain'
import { formatCurrency } from '~/utils/format'
import {
  countedParticipants,
  participantTypeLabel,
} from '~/utils/participants'
import { getSportMeta } from '~/utils/sports'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const api = useApi()
const config = useRuntimeConfig()
const teams = ref<Team[]>([])
const filter = ref<RegistrationStatus | 'ALL'>('PENDING')
const paymentFilter = ref<'ALL' | 'FREE' | 'PAID'>(
  route.query.payment === 'PAID' ? 'PAID' : 'ALL',
)

const events = ref<SportEvent[]>([])
const users = ref<AuthUser[]>([])
const { faculties, load: loadFaculties } = useFaculties()

const adv = reactive({
  eventId: 0,
  facultyId: 0,
  schoolId: 0,
  disciplineId: 0,
  participantType: 'ALL' as ParticipantType | 'ALL',
})

const filterSchools = computed(
  () => faculties.value.find((faculty) => faculty.id === adv.facultyId)?.schools ?? [],
)

watch(
  () => adv.facultyId,
  () => {
    adv.schoolId = 0
  },
)

watch(
  () => [adv.eventId, adv.facultyId, adv.schoolId, adv.disciplineId, adv.participantType],
  () => {
    loadTeams()
    loadDisciplines()
  },
)

watch(paymentFilter, () => {
  loadTeams()
})

const filters: { label: string; value: RegistrationStatus | 'ALL' }[] = [
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Aprobados', value: 'APPROVED' },
  { label: 'Rechazados', value: 'REJECTED' },
  { label: 'Todos', value: 'ALL' },
]

const paymentFilters: { label: string; value: 'ALL' | 'FREE' | 'PAID' }[] = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Gratuitos', value: 'FREE' },
  { label: 'De pago', value: 'PAID' },
]

const filtered = computed(() =>
  filter.value === 'ALL'
    ? teams.value
    : teams.value.filter((team) => team.status === filter.value),
)

function resolveUrl(path: string) {
  if (path.startsWith('http')) return path
  return config.public.apiBase.replace(/\/api\/v1$/, '') + path
}

function rulesCheck(team: Team): { ok: boolean; messages: string[] } {
  const messages: string[] = []
  const discipline = team.discipline
  const count = countedPlayers(team)
  if (discipline) {
    if (count < discipline.minPlayers)
      messages.push(`MÃ­nimo ${discipline.minPlayers} jugadores (tiene ${count}).`)
    if (count > discipline.maxPlayers)
      messages.push(`MÃ¡ximo ${discipline.maxPlayers} jugadores (tiene ${count}).`)
    if (discipline.genderPolicy === 'MALE' && team.participants.some((p) => p.gender === 'F'))
      messages.push('La disciplina es solo varones.')
    if (discipline.genderPolicy === 'FEMALE' && team.participants.some((p) => p.gender === 'M'))
      messages.push('La disciplina es solo mujeres.')
    if (discipline.participantType === 'STUDENT' && team.participants.some((p) => !p.studentCode))
      messages.push('Todos los jugadores deben tener cÃ³digo de estudiante.')
    if (discipline.participantType === 'STUDENT' && (!team.cycle || !team.section))
      messages.push('El equipo debe tener ciclo y secciÃ³n.')
    if (discipline.participantType === 'OTHER' && team.participants.some((p) => !p.dni))
      messages.push('Todos los jugadores deben tener DNI.')
  }
  return { ok: messages.length === 0, messages }
}

function countedPlayers(team: Team) {
  return countedParticipants(team.discipline?.participantType, team.participants)
}

function teamCycleSection(team: Team) {
  if (!team.cycle && !team.section) return '-'
  return `${team.cycle || 's/ciclo'} - ${team.section || 's/secciÃ³n'}`
}

function teamPhoneLabel(team: Team) {
  return team.phone?.trim() || 'Sin teléfono'
}

/** De pago: la disciplina cobra por equipo o el equipo se paga con el comprobante de su grupo. */
function needsVoucher(team: Team) {
  return !!team.discipline?.isPaid || (team.groupId !== null && team.groupId !== undefined)
}

function voucherBadge(team: Team) {
  if (!team.voucher) return 'Sin voucher'
  if (team.voucher.status === 'VALIDATED') return 'Voucher validado'
  if (team.voucher.status === 'REJECTED') return 'Voucher rechazado'
  return 'Voucher pendiente'
}

async function loadTeams() {
  const query: Record<string, number | boolean | ParticipantType> = {}
  if (paymentFilter.value === 'FREE') query.isPaid = false
  if (paymentFilter.value === 'PAID') query.isPaid = true
  if (adv.eventId) query.eventId = adv.eventId
  if (adv.facultyId) query.facultyId = adv.facultyId
  if (adv.schoolId) query.schoolId = adv.schoolId
  if (adv.disciplineId) query.disciplineId = adv.disciplineId
  if (adv.participantType !== 'ALL') query.participantType = adv.participantType
  try {
    teams.value = await api.get<Team[]>('/registrations', query)
  } catch {
    teams.value = []
  }
}

async function loadDisciplines() {
  const query: Record<string, number> = {}
  if (adv.eventId) query.eventId = adv.eventId
  if (adv.facultyId) query.facultyId = adv.facultyId
  if (adv.schoolId) query.schoolId = adv.schoolId
  try {
    disciplines.value = await api.get<Discipline[]>('/disciplines', query)
  } catch {
    disciplines.value = []
  }
}

async function loadUsers() {
  try {
    users.value = await api.get<AuthUser[]>('/users')
  } catch {
    users.value = []
  }
}

async function load() {
  try {
    events.value = await api.get<SportEvent[]>('/events')
    await Promise.all([loadFaculties(), loadDisciplines(), loadTeams(), loadUsers()])
  } catch {
    teams.value = []
  }
}

const reviewOpen = ref(false)
const reviewTeam = ref<Team | null>(null)
const reviewPlayersOpen = ref(false)
const registrationRejectReason = ref('')

const reviewRules = computed(() =>
  reviewTeam.value ? rulesCheck(reviewTeam.value) : { ok: true, messages: [] },
)

function openReview(team: Team) {
  reviewTeam.value = team
  registrationRejectReason.value = ''
  reviewPlayersOpen.value = false
  reviewOpen.value = true
}

async function approveReview() {
  if (!reviewTeam.value) return
  await api.patch(`/registrations/${reviewTeam.value.id}/approve`, {})
  reviewOpen.value = false
  await loadTeams()
}

async function rejectReview() {
  if (!reviewTeam.value) return
  const reason = registrationRejectReason.value.trim()
  if (!reason) return
  await api.patch(`/registrations/${reviewTeam.value.id}/reject`, { reason })
  reviewOpen.value = false
  await loadTeams()
}

async function validateVoucher() {
  if (!reviewTeam.value?.voucher) return
  await api.patch(`/vouchers/${reviewTeam.value.voucher.id}/validate`, {})
  reviewOpen.value = false
  await loadTeams()
}

const createOpen = ref(false)
const submitting = ref(false)
const modalError = ref('')
const disciplines = ref<Discipline[]>([])
const participantSearch = ref('')
const participantError = ref('')
const searching = ref(false)

const createForm = reactive({
  disciplineId: 0,
  delegateId: 0,
  teamName: '',
  phone: '',
  cycle: '',
  section: '',
  operationNumber: '',
  participants: [] as Participant[],
  voucherFile: null as File | null,
})

const selectedDiscipline = computed(() =>
  disciplines.value.find((discipline) => discipline.id === createForm.disciplineId),
)

const participantMode = computed<'STUDENT' | 'OTHER'>(
  () => selectedDiscipline.value?.participantType ?? 'STUDENT',
)

const delegateOptions = computed(() =>
  users.value.filter((user) => {
    const isStudent = user.role === 'STUDENT' || Boolean(user.studentCode || /^\d+@/.test(user.email))
    const isOther = user.role === 'OTHER' || (!isStudent && user.role !== 'ADMIN_SYSTEM' && user.role !== 'OWNER_SYSTEM')
    return participantMode.value === 'STUDENT' ? isStudent || isOther : isOther
  }),
)

watch(
  () => createForm.disciplineId,
  () => {
    createForm.delegateId = 0
  },
)

const createCountedPlayers = computed(() =>
  countedParticipants(participantMode.value, createForm.participants),
)

function removeParticipant(index: number) {
  createForm.participants.splice(index, 1)
}

function onVoucher(event: Event) {
  const target = event.target as HTMLInputElement
  createForm.voucherFile = target.files?.[0] ?? null
}

async function openCreate() {
  modalError.value = ''
  participantError.value = ''
  Object.assign(createForm, {
    disciplineId: 0,
    delegateId: 0,
    teamName: '',
    phone: '',
    cycle: '',
    section: '',
    operationNumber: '',
    participants: [],
    voucherFile: null,
  })
  participantSearch.value = ''
  createOpen.value = true
  if (!disciplines.value.length) await loadDisciplines()
  if (!users.value.length) await loadUsers()
}

async function searchParticipant() {
  const q = participantSearch.value.trim()
  if (!q) return
  if (!createForm.disciplineId) {
    participantError.value = 'Primero selecciona una disciplina.'
    return
  }
  searching.value = true
  participantError.value = ''
  try {
    let person: AcademicStudent
    if (participantMode.value === 'OTHER') {
      if (!/^\d{8}$/.test(q)) {
        participantError.value = 'Ingresa un DNI vÃ¡lido de 8 dÃ­gitos.'
        return
      }
      person = await api.get<AcademicStudent>('/academic/dni', { numero: q })
    } else {
      person = await api.get<AcademicStudent>('/academic/student', { buscador: q })
    }
    const code = person.studentCode?.trim() || null
    const dni = person.dni?.trim() || (/^\d{8}$/.test(q) ? q : null)
    const already = createForm.participants.some(
      (participant) =>
        (code && participant.studentCode === code) ||
        (dni && participant.dni === dni) ||
        (participant.fullName.toLowerCase() === person.fullName.toLowerCase() &&
          (!code || !participant.studentCode) &&
          (!dni || !participant.dni)),
    )
    if (already) {
      participantError.value = 'Esa persona ya fue agregada.'
      return
    }
    createForm.participants.push({
      fullName: person.fullName.replace(/\s+/g, ' ').trim(),
      studentCode: code,
      dni,
      gender: 'O',
      isDelegate: false,
      countsAsPlayer: true,
    })
    participantSearch.value = ''
  } catch {
    participantError.value =
      participantMode.value === 'OTHER'
        ? 'No se encontrÃ³ una persona con ese DNI.'
        : 'No se encontrÃ³ un estudiante Ãºnico con ese cÃ³digo.'
  } finally {
    searching.value = false
  }
}

async function submitCreate() {
  modalError.value = ''
  if (!createForm.disciplineId) {
    modalError.value = 'Selecciona una disciplina.'
    return
  }
  if (!createForm.delegateId) {
    modalError.value = 'Selecciona el delegado responsable.'
    return
  }
  if (!createForm.participants.length) {
    modalError.value = 'Agrega al menos un jugador.'
    return
  }
  if (
    participantMode.value === 'STUDENT' &&
    (!createForm.cycle.trim() || !createForm.section.trim())
  ) {
    modalError.value = 'Completa ciclo y secciÃ³n del equipo.'
    return
  }
  if (
    selectedDiscipline.value &&
    (createCountedPlayers.value < selectedDiscipline.value.minPlayers ||
      createCountedPlayers.value > selectedDiscipline.value.maxPlayers)
  ) {
    modalError.value = `El equipo debe tener entre ${selectedDiscipline.value.minPlayers} y ${selectedDiscipline.value.maxPlayers} jugadores. Tiene ${createCountedPlayers.value}.`
    return
  }
  if (selectedDiscipline.value?.isPaid && !createForm.voucherFile) {
    modalError.value = 'Esta disciplina tiene costo: adjunta el comprobante de pago.'
    return
  }
  submitting.value = true
  try {
    const fd = new FormData()
    fd.append('disciplineId', String(createForm.disciplineId))
    fd.append('delegateId', String(createForm.delegateId))
    fd.append('teamName', createForm.teamName)
    fd.append('phone', createForm.phone)
    fd.append('cycle', createForm.cycle)
    fd.append('section', createForm.section)
    fd.append('participants', JSON.stringify(createForm.participants))
    if (selectedDiscipline.value?.isPaid) {
      fd.append('operationNumber', createForm.operationNumber)
      if (createForm.voucherFile) fd.append('voucher', createForm.voucherFile)
    }
    await api.upload('/registrations', fd)
    createOpen.value = false
    await loadTeams()
  } catch (err) {
    modalError.value =
      (err as { data?: { message?: string | string[] } })?.data?.message?.toString() ??
      'No se pudo crear el equipo.'
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.input {
  margin-top: 0.25rem;
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid rgba(55, 65, 81, 0.4);
  background-color: #182029;
  padding: 0.625rem 0.75rem;
  color: white;
  outline: none;
}
.input:focus {
  border-color: #4ade80;
  box-shadow: 0 0 0 1px rgba(74, 222, 128, 0.4);
}
</style>
