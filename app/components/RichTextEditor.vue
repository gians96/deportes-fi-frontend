<template>
  <div class="overflow-hidden rounded-lg border border-oscuro-700 bg-oscuro-900/60">
    <div
      v-if="editor"
      class="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-oscuro-700 bg-oscuro-850/95 p-2"
    >
      <button
        v-for="action in actions"
        :key="action.label"
        type="button"
        class="inline-flex h-9 w-9 items-center justify-center rounded-lg text-oscuro-200 transition hover:bg-oscuro-700 hover:text-white"
        :class="{ 'bg-green-500/15 text-green-300': action.active?.() }"
        :title="action.label"
        :aria-label="action.label"
        :disabled="action.disabled?.()"
        @mousedown.prevent
        @click="action.run"
      >
        <component :is="action.icon" class="h-4 w-4" />
      </button>
    </div>

    <div
      class="rich-editor-shell overscroll-contain"
      :style="{ minHeight, maxHeight }"
    >
      <EditorContent
        :editor="editor"
        class="rich-editor"
        @dblclick.stop
      />
    </div>

    <p
      v-if="bytes > maxBytes * 0.5"
      class="border-t border-oscuro-700 px-3 py-1.5 text-xs"
      :class="bytes > maxBytes ? 'font-semibold text-red-300' : 'text-oscuro-300'"
    >
      {{ toKb(bytes) }} KB de {{ toKb(maxBytes) }} KB<template v-if="bytes > maxBytes">. Es demasiado largo: acórtalo para poder guardar.</template>
    </p>
  </div>
</template>

<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-vue-next'
import { RICH_TEXT_MAX_BYTES, normalizeEditorHtml, richTextBytes } from '~/utils/richText'

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    minHeight?: string
    maxHeight?: string
    /** Tamaño máximo del texto en bytes; el contador aparece al pasar de la mitad. */
    maxBytes?: number
  }>(),
  {
    modelValue: '',
    minHeight: '220px',
    maxHeight: '420px',
    maxBytes: RICH_TEXT_MAX_BYTES,
  },
)

const bytes = computed(() => richTextBytes(props.modelValue))
const toKb = (value: number) => (value / 1000).toFixed(1)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = useEditor({
  content: props.modelValue || '',
  // TipTap 3: el StarterKit ya incluye Underline y Link. Declararlos aparte los duplica y TipTap avisa
  // «Duplicate extension names found»; por eso solo se configuran aquí.
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      },
    }),
  ],
  editorProps: {
    attributes: {
      class: 'min-h-full px-4 py-3 text-sm leading-relaxed text-white outline-none',
    },
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', normalizeEditorHtml(editor.getHTML()))
  },
})

const actions = computed(() => {
  const e = editor.value
  if (!e) return []

  return [
    {
      label: 'Negrita',
      icon: Bold,
      active: () => e.isActive('bold'),
      run: () => e.chain().focus().toggleBold().run(),
    },
    {
      label: 'Cursiva',
      icon: Italic,
      active: () => e.isActive('italic'),
      run: () => e.chain().focus().toggleItalic().run(),
    },
    {
      label: 'Subrayado',
      icon: UnderlineIcon,
      active: () => e.isActive('underline'),
      run: () => e.chain().focus().toggleUnderline().run(),
    },
    {
      label: 'Título grande',
      icon: Heading2,
      active: () => e.isActive('heading', { level: 2 }),
      run: () => e.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: 'Título mediano',
      icon: Heading3,
      active: () => e.isActive('heading', { level: 3 }),
      run: () => e.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: 'Viñetas',
      icon: List,
      active: () => e.isActive('bulletList'),
      run: () => e.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Lista numerada',
      icon: ListOrdered,
      active: () => e.isActive('orderedList'),
      run: () => e.chain().focus().toggleOrderedList().run(),
    },
    {
      label: 'Cita',
      icon: Quote,
      active: () => e.isActive('blockquote'),
      run: () => e.chain().focus().toggleBlockquote().run(),
    },
    {
      label: 'Enlace',
      icon: LinkIcon,
      active: () => e.isActive('link'),
      run: setLink,
    },
    {
      label: 'Limpiar formato',
      icon: RemoveFormatting,
      run: () => e.chain().focus().unsetAllMarks().clearNodes().run(),
    },
    {
      label: 'Deshacer',
      icon: Undo2,
      disabled: () => !e.can().undo(),
      run: () => e.chain().focus().undo().run(),
    },
    {
      label: 'Rehacer',
      icon: Redo2,
      disabled: () => !e.can().redo(),
      run: () => e.chain().focus().redo().run(),
    },
  ]
})

watch(
  () => props.modelValue,
  (value) => {
    const e = editor.value
    if (!e) return

    const next = value || ''
    if (normalizeEditorHtml(e.getHTML()) !== normalizeEditorHtml(next)) {
      e.commands.setContent(next, { emitUpdate: false })
    }
  },
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})

function setLink() {
  const e = editor.value
  if (!e) return

  const previousUrl = e.getAttributes('link').href as string | undefined
  const url = window.prompt('URL del enlace', previousUrl || 'https://')

  if (url === null) return
  if (!url.trim()) {
    e.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

  e.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
}
</script>

<style scoped>
.rich-editor {
  min-height: 100%;
}
.rich-editor-shell {
  overflow-y: auto;
  scrollbar-gutter: stable;
}
.rich-editor :deep(.tiptap) {
  min-height: 100%;
}
.rich-editor :deep(h2) {
  margin: 1rem 0 0.5rem;
  font-size: 1.25rem;
  font-weight: 800;
}
.rich-editor :deep(h3) {
  margin: 0.9rem 0 0.4rem;
  font-size: 1.05rem;
  font-weight: 800;
}
.rich-editor :deep(p) {
  margin: 0.45rem 0;
}
.rich-editor :deep(ul),
.rich-editor :deep(ol) {
  margin: 0.65rem 0;
  padding-left: 1.4rem;
}
.rich-editor :deep(ul) {
  list-style: disc;
}
.rich-editor :deep(ol) {
  list-style: decimal;
}
.rich-editor :deep(blockquote) {
  margin: 0.9rem 0;
  border-left: 3px solid #22c55e;
  padding-left: 0.8rem;
  color: #d1d5db;
}
.rich-editor :deep(a) {
  color: #86efac;
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
