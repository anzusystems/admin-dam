import type { EditorState } from '@tiptap/pm/state'

export const isTextSelected = (editorState: EditorState) => !editorState.selection.empty
