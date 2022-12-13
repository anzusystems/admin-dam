<script lang="ts" setup>
import { ref } from 'vue'
import AFilterSubmitButton from '@/components/common/buttons/filter/AFilterSubmitButton.vue'
import AFilterResetButton from '@/components/common/buttons/filter/AFilterResetButton.vue'
import AFilterAdvancedButton from '@/components/common/buttons/filter/AFilterAdvancedButton.vue'

withDefaults(
  defineProps<{
    enableAdvanced?: boolean
    enableTop?: boolean
    hideButtons?: boolean
  }>(),
  {
    enableAdvanced: false,
    enableTop: false,
    hideButtons: false,
  }
)
const emit = defineEmits<{
  (e: 'resetFilter'): void
}>()

const resetFilter = () => {
  emit('resetFilter')
}

const advancedFilter = ref(false)

const toggleAdvancedFilter = () => {
  advancedFilter.value = !advancedFilter.value
}
</script>

<template>
  <VRow dense v-if="enableTop">
    <VCol class="">
      <slot name="top"></slot>
    </VCol>
  </VRow>
  <VRow dense>
    <VCol v-if="enableAdvanced" class="v-col-filters--show-hide" cols="auto">
      <AFilterAdvancedButton
        :button-active="advancedFilter"
        @advanced-filter="toggleAdvancedFilter"
      ></AFilterAdvancedButton>
    </VCol>
    <VCol class="">
      <slot name="default"></slot>
      <VExpandTransition v-if="enableAdvanced">
        <div v-show="advancedFilter">
          <slot name="advanced"></slot>
        </div>
      </VExpandTransition>
    </VCol>
    <VCol class="v-col-filters--buttons text-right" cols="auto" v-if="!hideButtons">
      <slot name="buttons">
        <AFilterSubmitButton></AFilterSubmitButton>
        <AFilterResetButton @reset="resetFilter"></AFilterResetButton>
      </slot>
    </VCol>
  </VRow>
</template>
