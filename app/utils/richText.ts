import DOMPurify from 'dompurify'

const HTML_RE = /<\/?[a-z][\s\S]*>/i

const sanitizeConfig = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    'h2',
    'h3',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
}

/**
 * Tamaño máximo de un texto con formato, en bytes UTF-8. El backend lo guarda en una columna TEXT (65 535
 * bytes) y rechaza lo que no cabe (mismo valor que `RICH_TEXT_MAX_BYTES` del backend, con margen).
 */
export const RICH_TEXT_MAX_BYTES = 60_000

export function richTextBytes(value?: string | null) {
  return value ? new TextEncoder().encode(value).length : 0
}

export function isRichTextEmpty(value?: string | null) {
  if (!value) return true
  return !value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

export function sanitizeRichTextHtml(value?: string | null) {
  if (!value) return ''
  if (!import.meta.client) return value

  return DOMPurify.sanitize(value, sanitizeConfig)
}

export function normalizeEditorHtml(value?: string | null) {
  const html = sanitizeRichTextHtml(value)
  return isRichTextEmpty(html) ? '' : html
}

export function richTextToDisplayHtml(value?: string | null) {
  if (!value) return ''
  const html = HTML_RE.test(value) ? value : plainTextToHtml(value)
  return sanitizeRichTextHtml(html)
}

export function richTextToPlainText(value?: string | null) {
  if (!value) return ''
  const html = richTextToDisplayHtml(value)

  if (import.meta.client) {
    const element = document.createElement('div')
    element.innerHTML = html
    return (element.textContent || '').trim()
  }

  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|h2|h3|li|blockquote)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{2,}/g, '\n')
    .trim()
}

function plainTextToHtml(value: string) {
  const blocks = value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  return blocks
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
