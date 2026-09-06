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

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  checkReallyDraggingEnded(event, true)
}
const onDragEnd = (event: DragEvent) => {
  event.preventDefault()
  checkReallyDraggingEnded(event, false)
}

export function useWindowFilesDragWatcher() {
  if (!isInitialized.value && window.document) {
    isInitialized.value = true
    window.document.addEventListener('dragover', onDragOver)
    window.document.addEventListener('dragleave', onDragEnd)
    window.document.addEventListener('drop', onDragEnd)
  }

  const hideDragOverWindow = () => {
    dragOverWindow.value = false
  }

  return {
    dragOverWindow: readonly(dragOverWindow),
    hideDragOverWindow,
  }
}
