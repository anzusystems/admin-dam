import type { EditorState } from '@tiptap/pm/state'

export const isTextSelected = (editorState: EditorState) => {
  return !editorState.selection.empty
}
