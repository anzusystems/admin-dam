import { ref } from 'vue'

const customFooterHeight = ref(0)
const customDialog = ref(false)
const sidebarLeft = ref(false)
const sidebarRight = ref(false)

export const useMainWrapper = () => {
  return {
    customFooterHeight,
    customDialog,
    sidebarLeft,
    sidebarRight,
  }
}
