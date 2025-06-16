<script setup lang="ts">
import { useWindowFilesDragWatcher } from '@/composables/system/windowFilesDragWatcher'
import { computed, ref, watch } from 'vue'
import { arrayFlatten, arrayFromArgs, damFileTypeFix, isArray, isUndefined, useAlerts } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'

type InputRef = null | HTMLInputElement

const props = withDefaults(
  defineProps<{
    fileInputKey: number
    variant?: 'dropzone-fullscreen' | 'button' | 'icon' | 'slot-upload'
    accept?: string // example: 'image/*,.jpg'
    maxSizes?: Record<string, number> // example: { 'image/*': 20000 } or { 'image/png': 20000, 'image/jpg': 20000 } or { '.jpg': 20000, '.png': 20000 } or { '*': 20000, }
    directory?: boolean
    disableTraverse?: boolean
    multiple?: boolean
    buttonText?: string
    height?: number
  }>(),
  {
    variant: 'dropzone-fullscreen',
    accept: undefined,
    maxSizes: undefined,
    directory: false,
    disableTraverse: false,
    multiple: true,
    buttonText: '',
    height: 34,
  }
)

const emit = defineEmits<{
  (e: 'change', event: DragEvent): void
  (e: 'filesInput', files: File[]): void
}>()

const BLOCK_DOUBLE_CLICK_MS = 200

const { t } = useI18n()

const inputRef = ref<InputRef>(null)

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const selectedFiles = ref<File[] | File | null>(props.multiple ? [] : null)

const blockDoubleClick = ref(false)

const clickDropzone = () => {
  if (blockDoubleClick.value === true) {
    return
  }
  blockDoubleClick.value = true
  inputRef.value?.click()
  setTimeout(() => {
    blockDoubleClick.value = false
  }, BLOCK_DOUBLE_CLICK_MS)
}

const onDrop = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  hideDragOverWindow()
  if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
    onFileChange(event)
  }
}

interface FileSystemFileEntry extends FileSystemEntry {
  file(callback: (file: File) => void): void
}

interface FileSystemDirectoryReader {
  readEntries(callback: (entries: FileSystemEntry[]) => void): void
}

interface FileSystemDirectoryEntry extends FileSystemEntry {
  createReader(): FileSystemDirectoryReader
}

// Type guards to narrow the types
function isFileEntry(entry: FileSystemEntry): entry is FileSystemFileEntry {
  return entry.isFile
}

function isDirectoryEntry(entry: FileSystemEntry): entry is FileSystemDirectoryEntry {
  return entry.isDirectory
}

function flattenFileArray(array: (File | File[])[]): File[] {
  const result: File[] = []

  for (const item of array) {
    if (Array.isArray(item)) {
      result.push(...item)
    } else {
      result.push(item)
    }
  }

  return result
}

const traverseFileTree = (item: FileSystemEntry, path = '') => {
  // Based on https://stackoverflow.com/questions/3590058
  return new Promise<File | File[]>((resolve) => {
    if (isFileEntry(item)) {
      item.file((file: File) => {
        ;(file as File & { $path: string }).$path = path
        resolve(file)
      })
    } else if (isDirectoryEntry(item)) {
      item.createReader().readEntries((entries: FileSystemEntry[]) => {
        const queue: Promise<File | File[]>[] = []
        for (let i = 0; i < entries.length; i++) {
          queue.push(traverseFileTree(entries[i], path + item.name + '/'))
        }
        Promise.all(queue).then((filesArr) => {
          const flattenedFiles = flattenFileArray(filesArr)
          resolve(flattenedFiles)
        })
      })
    }
  })
}

const setFiles = (files: File[] | undefined = []) => {
  if (!files) {
    selectedFiles.value = props.multiple ? [] : null
    return
  } else if (props.multiple) {
    const filesArray = []
    for (let i = 0; i < files.length; i++) {
      filesArray.push(files[i])
    }
    selectedFiles.value = filesArray
    return
  }
  selectedFiles.value = files[0] || null
}

const onFileChange = (event: Event) => {
  const dragEvent = event as DragEvent
  emit('change', dragEvent)
  const items = dragEvent.dataTransfer && dragEvent.dataTransfer.items
  if (items && !props.disableTraverse) {
    const queue = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry()
      if (item) {
        queue.push(traverseFileTree(item))
      }
    }
    Promise.all(queue).then((filesArr) => {
      setFiles(arrayFromArgs<File>(filesArr as File[]))
    })
    return
  }
  // @ts-ignore
  if (dragEvent && dragEvent.target && dragEvent.target.files) {
    // @ts-ignore
    setFiles(dragEvent.target.files)
  } else if (dragEvent && dragEvent.dataTransfer && dragEvent.dataTransfer.files) {
    setFiles(Array.from(dragEvent.dataTransfer.files as ArrayLike<File>))
  }
}

const { dragOverWindow, hideDragOverWindow } = useWindowFilesDragWatcher()

const onReset = () => {
  selectedFiles.value = props.multiple ? [] : null
}

const acceptKeys = computed(() => {
  if (isUndefined(props.accept)) {
    return []
  }
  return props.accept.split(',')
})

const maxSizeKeys = computed(() => {
  if (isUndefined(props.maxSizes)) {
    return []
  }
  return Object.keys(props.maxSizes)
})

const checkFormatsAndSizes = (files: File[]) => {
  const incorrectFileNames: string[] = []
  const validFiles = files.filter((file) => {
    const isFileValid = checkFormats(file, acceptKeys.value) && checkSizes(file, maxSizeKeys.value, props.maxSizes)
    if (!isFileValid) {
      incorrectFileNames.push(file.name)
    }
    return isFileValid
  })
  if (incorrectFileNames.length) {
    const { showWarning } = useAlerts()
    showWarning(t('system.upload.incorrectFormatSize') + ':' + incorrectFileNames.join(', '))
  }

  return validFiles
}
const checkFormats = (file: File, accepts: string[]) => {
  if (accepts.length === 0) {
    return true
  }
  for (let i = 0; i < accepts.length; i++) {
    if (accepts[i].startsWith('.')) {
      // .format
      if (file.name.toLowerCase().endsWith(accepts[i])) {
        return true
      }
    } else {
      // type
      const splitType = accepts[i].split('/')
      if (splitType[1] === '*' && damFileTypeFix(file).startsWith(splitType[0] + '/')) {
        return true
      } else if (accepts[i] === damFileTypeFix(file)) {
        return true
      }
    }
  }
  return false
}
const checkSizes = (file: File, keys: Array<string>, sizes: Record<string, number> | undefined) => {
  if (keys.length === 0 || isUndefined(sizes)) {
    return true
  }
  for (let j = 0; j < keys.length; j++) {
    if (keys[j] === '*' && sizes[keys[j]] <= file.size) {
      // *
      return true
    } else if (keys[j].startsWith('.') && sizes[keys[j]] <= file.size) {
      // .format
      return true
    } else {
      // type
      const splitType = keys[j].split('/')
      if (splitType[1] === '*' && damFileTypeFix(file).startsWith(splitType[0] + '/') && sizes[keys[j]] > file.size) {
        return true
      } else if (keys[j] === damFileTypeFix(file) && sizes[keys[j]] > file.size) {
        return true
      }
    }
  }
  return false
}

watch(selectedFiles, (newValue, oldValue) => {
  if (
    newValue === oldValue ||
    (isArray(newValue) &&
      isArray(oldValue) &&
      newValue.length === oldValue.length &&
      newValue.every((v, i) => v === oldValue[i]))
  ) {
    return
  }
  if (!newValue && props.multiple) {
    emit('filesInput', [])
    return
  }
  if (isArray(newValue)) {
    emit('filesInput', checkFormatsAndSizes(arrayFlatten(newValue)))
    return
  }
  if (newValue) {
    emit('filesInput', checkFormatsAndSizes([newValue]))
  }
})
</script>

<template>
  <div
    v-if="variant === 'icon'"
    class="dam-upload-icon d-inline-flex"
  >
    <VBtn
      tabindex="-1"
      icon
      variant="text"
      :height="height"
      :width="height"
      @click.stop="clickDropzone"
    >
      <VIcon icon="mdi-plus" />
      <VTooltip
        activator="parent"
        location="bottom"
      >
        {{ t('system.upload.add') }}
      </VTooltip>
    </VBtn>
  </div>
  <VBtn
    v-if="variant === 'slot-upload'"
    tabindex="-1"
    icon
    variant="flat"
    :height="height"
    :width="height"
    @click.stop="clickDropzone"
  >
    <VIcon
      icon="mdi-plus"
      :size="18"
    />
    <VTooltip
      activator="parent"
      location="bottom"
    >
      {{ t('system.upload.add') }}
    </VTooltip>
  </VBtn>
  <div
    v-if="variant === 'button'"
    class="dam-upload-button d-inline-flex"
  >
    <VBtn
      tabindex="-1"
      color="primary"
      rounded="pill"
      variant="flat"
      :height="height"
      @click.stop="clickDropzone"
    >
      <template #prepend>
        <VIcon icon="mdi-upload" />
      </template>
      {{ buttonText }}
    </VBtn>
  </div>
  <div
    v-show="dragOverWindow"
    v-if="variant === 'dropzone-fullscreen'"
    class="dam-upload-dropzone dam-upload-dropzone--fullscreen"
    @drop="onDrop"
    @click.stop="clickDropzone"
  >
    <div class="text-h1">
      {{ t('system.upload.dragAndDrop') }}
    </div>
  </div>
  <input
    ref="inputRef"
    :key="fileInputKey"
    :accept="accept"
    :multiple="multiple"
    :webkitdirectory="directory"
    hidden
    tabindex="-1"
    type="file"
    @change="onFileChange"
    @reset="onReset"
  >
</template>

<style lang="scss">
.dam-upload-dropzone {
  inset: 0;
  position: absolute;
  background-color: #e5edf1;
  outline: 2px dashed #bacfd4;
  outline-offset: -4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &--fullscreen {
    position: fixed;
    z-index: 9999;
    text-align: center;
  }
}
</style>
