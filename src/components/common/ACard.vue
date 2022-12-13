<script lang="ts" setup>
import { isNull } from '@/utils/common'
import type { LoaderName } from '@/composables/system/uiHelper'
import { useUiHelper } from '@/composables/system/uiHelper'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    loading?: boolean | null
    loader?: LoaderName | ''
    innerDivClass?: string
    title?: string
  }>(),
  {
    loading: null,
    loader: '',
    innerDivClass: 'pa-2',
    title: undefined,
  }
)

const { loader: globalLoader } = useUiHelper()

const loadingComputed = computed(() => {
  if (!isNull(props.loading)) {
    return props.loading
  }
  if (props.loader !== '') {
    return globalLoader[props.loader]
  }
  return false
})
</script>

<template>
  <VCard :title="title" elevation="0">
    <div class="progress-container">
      <VProgressLinear :active="loadingComputed" color="primary" height="3" indeterminate rounded></VProgressLinear>
    </div>
    <div :class="innerDivClass">
      <slot></slot>
    </div>
    <div v-show="loadingComputed" class="a-overlay"></div>
  </VCard>
</template>

<style lang="scss" scoped>
.progress-container {
  height: 3px;
  width: 100%;
}

.a-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgb(0 0 0 / 10%);
  z-index: 5;
}
</style>
