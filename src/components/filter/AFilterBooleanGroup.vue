<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

import type { Filter } from '@/types/Filter'

const props = withDefaults(
  defineProps<{
    modelValue: Filter
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: any): void
}>()

const { t } = useI18n({ useScope: 'global' })

const value = computed({
  get() {
    return props.modelValue.model
  },
  set(newValue) {
    emit('update:modelValue', { ...props.modelValue, ...{ model: newValue } })
  },
})
</script>

<template>
  <div class="a-filter-boolean-group d-flex flex-column align-left justify-center mb-2">
    <VLabel class="pr-1">
      <span>{{ modelValue.title }}</span>
    </VLabel>
    <VBtnToggle v-model="value" size="small">
      <VBtn size="small" :value="true" :color="value === true ? 'secondary' : ''">
        {{ t('common.boolean.true') }}
      </VBtn>
      <VBtn size="small" :value="false" :color="value === false ? 'secondary' : ''">
        {{ t('common.boolean.false') }}
      </VBtn>
    </VBtnToggle>
  </div>
</template>

<style lang="scss" scoped>
.a-filter-boolean-group {
  position: relative;

  .v-label {
    position: absolute;
    top: -4px;
    left: 0;
    z-index: 2;
  }

  .v-btn-group {
    position: relative;
    margin-top: 20px;

    .v-btn {
      height: 33px !important;
    }
  }
}
</style>
