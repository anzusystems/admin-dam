<script lang="ts" setup>
import { isNull } from '@/utils/common'
import type { ButtonName } from '@/composables/system/uiHelper'
import { useUiHelper } from '@/composables/system/uiHelper'
import { computed, onMounted } from 'vue'
import type { IconValue } from '@/types/Vuetify'

const props = withDefaults(
  defineProps<{
    loading?: boolean | null
    disabled?: boolean | null
    color?: string
    btnHelper?: ButtonName | null
    dataCy?: string
    icon?: IconValue
  }>(),
  {
    loading: null,
    disabled: null,
    color: '',
    btnHelper: null,
    dataCy: '',
    icon: undefined,
  }
)

const { btn } = useUiHelper()

const disabledComputed = computed(() => {
  if (!isNull(props.disabled) && props.disabled) return props.disabled
  if (!isNull(props.loading) && props.loading) return props.loading
  try {
    if (!isNull(props.btnHelper)) return btn[props.btnHelper].disabled || btn[props.btnHelper].loading
  } catch {
    return false
  }
  return false
})

const loadingComputed = computed(() => {
  if (!isNull(props.loading) && props.loading) return props.loading
  try {
    if (!isNull(props.btnHelper)) return btn[props.btnHelper].loading
  } catch {
    return false
  }
  return false
})

onMounted(() => {
  console.warn('ABtn.vue is deprecated, use VBtn instead')
})
</script>

<template>
  <VBtn
    :color="color"
    :disabled="disabledComputed"
    class="a-btn"
    :loading="loadingComputed"
    :data-cy="dataCy"
    :icon="icon"
  >
    <span v-if="icon"><VIcon :icon="icon"></VIcon></span>
    <span v-else><slot></slot></span>
    <VTooltip v-if="icon" activator="parent" location="bottom"><slot></slot></VTooltip>
  </VBtn>
</template>
