<script lang="ts" setup>
import type { Filter } from '@/types/Filter'
import { useFilterHelpers } from '@/composables/filter/filterHelpers'
import { computed } from 'vue'
import { damConfig } from '@/services/DamConfigService'
import { isArray } from '@/utils/common'
import { toggleArrayItem } from '@/utils/array'
import { simpleCloneObject } from '@/utils/object'
import { pickTextColorBasedOnBgColor } from '@/utils/colors'

const props = withDefaults(
  defineProps<{
    modelValue: Filter
    multiple?: boolean
    dataCy?: string
  }>(),
  {
    multiple: false, // todo multiple false
    dataCy: 'filter-color',
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: Filter): void
}>()

const value = computed({
  get() {
    return props.modelValue.model
  },
  set(newValue) {
    emit('update:modelValue', { ...props.modelValue, ...{ model: newValue } })
  },
})

const items = computed(() => {
  return Object.keys(damConfig.colorSet).map((key) => ({
    name: key,
    color: damConfig.colorSet[key],
    selected: isArray(value.value)
      ? value.value.includes(damConfig.colorSet[key])
      : value.value === damConfig.colorSet[key],
    iconColor: pickTextColorBasedOnBgColor(damConfig.colorSet[key], '#fff', '#000'),
  }))
})

const showClear = computed(() => {
  if (isArray(value.value)) {
    return value.value.length > 0
  }
  return value.value === ''
})

const toggleSelected = (color: string) => {
  if (isArray(value.value)) {
    const cloned = simpleCloneObject(value.value)
    toggleArrayItem(cloned, color)
    value.value = cloned
    return
  }
  value.value = color
}

const { clearOne } = useFilterHelpers()

const clear = () => {
  clearOne(props.modelValue)
  value.value = props.modelValue.model
}
</script>

<template>
  <div class="d-flex flex-column align-left justify-center mb-2">
    <VLabel class="pr-1">
      <span>{{ modelValue.title }}</span>
    </VLabel>
    <div class="color-swatches d-flex flex-wrap">
      <div
        class="color-swatches__item pa-1 cursor-pointer position-relative system-border-a"
        :class="{ 'color-swatches__item--active': item.selected }"
        :style="{ backgroundColor: item.color }"
        @click.stop="toggleSelected(item.color)"
        v-for="(item, key) in items"
        :key="key"
        :title="item.name"
      >
        <VIcon v-show="item.selected" icon="mdi-check position-absolute" :color="item.iconColor" :size="20" />
      </div>
      <VBtn @click.stop="clear" v-show="showClear" icon="mdi-close-circle" variant="text" :width="24" :height="24" />
    </div>
  </div>
</template>

<style lang="scss">
.color-swatches {
  &__item {
    min-width: 24px;
    height: 24px;
    margin: 0 2px 2px 0;
    opacity: 0.7;
    border-radius: 3px;

    &--active {
      opacity: 1;
    }

    .v-icon {
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }
}
</style>
