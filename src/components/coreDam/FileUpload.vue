<script setup lang="ts">
import { useWindowFilesDragWatcher } from '@/composables/system/windowFilesDragWatcher'
import { computed, ref, watch } from 'vue'
import { arrayFlatten, arrayFromArgs, isArray, isUndefined, useAlerts } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'

type InputRef = null | HTMLInputElement

const BLOCK_DOUBLE_CLICK_MS = 200

const { t } = useI18n()

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
  (e: 'filesInput', files: any[]): void
}>()

const inputRef = ref<InputRef>(null)

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

const traverseFileTree = (item: any, path: string | undefined = undefined) => {
  // Based on https://stackoverflow.com/questions/3590058
  return new Promise((resolve) => {
    path = path || ''
    if (item.isFile) {
      // Get file
      item.file((file: any) => {
        file.$path = path
        resolve(file)
      })
    } else if (item.isDirectory) {
      item.createReader().readEntries((entries: any) => {
        const queue = []
        for (let i = 0; i < entries.length; i++) {
          queue.push(traverseFileTree(entries[i], path + item.name + '/'))
        }
        Promise.all(queue).then((filesArr) => {
          resolve(arrayFromArgs(filesArr))
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

const onFileChange = (event: DragEvent) => {
  emit('change', event)
  const items = event.dataTransfer && event.dataTransfer.items
  if (items && !props.disableTraverse) {
    const queue = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry()
      if (item) {
        queue.push(traverseFileTree(item))
      }
    }
    Promise.all(queue).then((filesArr) => {
      // @ts-ignore
      setFiles(arrayFromArgs(filesArr))
    })
    return
  }
  // @ts-ignore
  if (event && event.target && event.target.files) {
    // @ts-ignore
    setFiles(event.target.files)
  } else if (event && event.dataTransfer && event.dataTransfer.files) {
    setFiles(Array.from(event.dataTransfer.files as ArrayLike<File>))
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
      if (splitType[1] === '*' && file.type.startsWith(splitType[0] + '/')) {
        return true
      } else if (accepts[i] === file.type) {
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
      if (splitType[1] === '*' && file.type.startsWith(splitType[0] + '/') && sizes[keys[j]] > file.size) {
        return true
      } else if (keys[j] === file.type && sizes[keys[j]] > file.size) {
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
  <div v-if="variant === 'icon'" class="dam-upload-icon d-inline-flex">
    <VBtn
      tabindex="-1"
      icon
      variant="flat"
      :height="height"
      :width="height"
      color="secondary"
      @click.stop="clickDropzone"
    >
      <VIcon icon="mdi-plus" />
      <VTooltip activator="parent" location="bottom">{{ t('system.upload.add') }}</VTooltip>
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
    <VIcon icon="mdi-plus" :size="18" />
    <VTooltip activator="parent" location="bottom">{{ t('system.upload.add') }}</VTooltip>
  </VBtn>
  <div v-if="variant === 'button'" class="dam-upload-button d-inline-flex">
    <VBtn tabindex="-1" color="primary" rounded="pill" variant="flat" :height="height" @click.stop="clickDropzone">
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
    <div class="text-h1">{{ t('system.upload.dragAndDrop') }}</div>
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
  />
</template>

<style lang="scss">
.dam-upload-dropzone {
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
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
