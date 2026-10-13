import type { AcademicStudent, Participant } from '~/types/domain'

export interface RosterHit {
  participant: Participant
  /** El DNI vino de la API (padrón) y no hubo que escribirlo. */
  dniFromRegistry: boolean
}

/**
 * Búsqueda de personas para armar la nómina de un equipo: por código de estudiante (disciplinas de
 * estudiantes) o por DNI (otros participantes). Se comparte entre el formulario del delegado y el editor
 * del administrador. No guarda nada en el navegador.
 */
export function useRosterSearch() {
  const api = useApi()
  const searching = ref(false)
  const searchError = ref('')

  /**
   * Devuelve la persona encontrada o `null` y deja el motivo en `searchError` (no existe, ya está en la
   * lista o la consulta falló).
   */
  async function find(
    query: string,
    mode: 'STUDENT' | 'OTHER',
    current: Participant[],
  ): Promise<RosterHit | null> {
    const q = query.trim()
    searchError.value = ''
    if (!q) return null
    searching.value = true
    try {
      let person: AcademicStudent
      if (mode === 'OTHER') {
        if (!/^\d{8}$/.test(q)) {
          searchError.value = 'Ingresa un DNI válido de 8 dígitos.'
          return null
        }
        person = await api.get<AcademicStudent>('/academic/dni', { numero: q })
      } else {
        person = await api.get<AcademicStudent>('/academic/student', { buscador: q })
      }
      const code = person.studentCode?.trim() || null
      const registryDni = person.dni?.trim() || null
      const dni = registryDni || (/^\d{8}$/.test(q) ? q : null)
      const already = current.some(
        (p) =>
          (code && p.studentCode === code) ||
          (dni && p.dni === dni) ||
          (p.fullName.toLowerCase() === person.fullName.toLowerCase() &&
            (!code || !p.studentCode) &&
            (!dni || !p.dni)),
      )
      if (already) {
        searchError.value = 'Esa persona ya fue agregada.'
        return null
      }
      return {
        participant: {
          fullName: person.fullName.replace(/\s+/g, ' ').trim(),
          studentCode: code,
          dni,
          gender: 'O',
          isDelegate: false,
          countsAsPlayer: true,
        },
        dniFromRegistry: mode === 'STUDENT' && !!registryDni,
      }
    } catch {
      searchError.value =
        mode === 'OTHER'
          ? 'No se encontró una persona con ese DNI.'
          : 'No se encontró un estudiante único con ese código.'
      return null
    } finally {
      searching.value = false
    }
  }

  return { searching, searchError, find }
}
