import { readonly, ref } from 'vue'

const isInitialized = ref(false)
const dragOverWindow = ref(false)
let draggingTimer: ReturnType<typeof setTimeout> | undefined = undefined

const dragEventContainsFiles = (event: DragEvent) => {
  if (event.dataTransfer?.types) {
    for (let i = 0; i < event.dataTransfer.types.length; i++) {
      if (event.dataTransfer.types[i] === 'Files') {
        return true
      }
    }
  }

  return false
}

const checkReallyDraggingEnded = (event: DragEvent, dragging: boolean) => {
  if (!dragEventContainsFiles(event)) {
    return
  }
  if (dragging) {
    dragOverWindow.value = true
    clearTimeout(draggingTimer)
  } else {
    clearTimeout(draggingTimer)
    draggingTimer = setTimeout(() => {
      dragOverWindow.value = false
    }, 100)
  }
}

export function useWindowFilesDragWatcher() {
  if (!isInitialized.value && window.document) {
    isInitialized.value = true
    window.document.addEventListener('dragover', (event) => {
      event.preventDefault()
      checkReallyDraggingEnded(event, true)
    })

    window.document.addEventListener('dragleave', (event) => {
      event.preventDefault()
      checkReallyDraggingEnded(event, false)
    })

    window.document.addEventListener('drop', (event) => {
      event.preventDefault()
      checkReallyDraggingEnded(event, false)
    })
  }

  const hideDragOverWindow = () => {
    dragOverWindow.value = false
  }

  return {
    dragOverWindow: readonly(dragOverWindow),
    hideDragOverWindow,
  }
}
