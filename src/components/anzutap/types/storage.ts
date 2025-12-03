import type { Ref } from 'vue'

export interface EditorStorageWithLink {
  link?: {
    dialog: Ref<boolean>
  }
}
