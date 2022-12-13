import { reactive } from 'vue'

const filter = reactive({})

export function useImageRoiListFilter() {
  return filter
}
