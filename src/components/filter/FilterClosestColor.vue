<script lang="ts" setup>
import { pickTextColorBasedOnBgColor } from '@/utils/colors'
import {
  arrayItemToggle,
  cloneDeep,
  type Filter,
  isArray,
  useDamConfigStore,
  useFilterHelpers,
} from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

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

const damConfigStore = useDamConfigStore()
const { damPrvConfig } = storeToRefs(damConfigStore)

const items = computed(() => {
  return Object.keys(damPrvConfig.value.colorSet).map((key) => ({
    name: key,
    color: damPrvConfig.value.colorSet[key],
    selected: isArray(value.value)
      ? value.value.includes(damPrvConfig.value.colorSet[key])
      : value.value === damPrvConfig.value.colorSet[key],
    iconColor: pickTextColorBasedOnBgColor(damPrvConfig.value.colorSet[key], '#fff', '#000'),
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
    const cloned = cloneDeep(value.value)
    arrayItemToggle(cloned, color)
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

const { t } = useI18n()

const label = computed(() => {
  return props.modelValue.titleT ? t(props.modelValue.titleT) : undefined
})
</script>

<template>
  <div class="d-flex flex-column align-left justify-center mb-2">
    <VLabel class="pr-1">
      <span v-if="label">{{ label }}</span>
    </VLabel>
    <div class="color-swatches d-flex flex-wrap">
      <div
        v-for="(item, key) in items"
        :key="key"
        class="color-swatches__item pa-1 cursor-pointer position-relative system-border-a"
        :class="{ 'color-swatches__item--active': item.selected }"
        :style="{ backgroundColor: item.color }"
        :title="item.name"
        @click.stop="toggleSelected(item.color)"
      >
        <VIcon
          v-show="item.selected"
          icon="mdi-check position-absolute"
          :color="item.iconColor"
          :size="20"
        />
        <VTooltip
          activator="parent"
          location="bottom"
        >
          {{ item.color }}
        </VTooltip>
      </div>
      <VBtn
        v-show="showClear"
        icon="mdi-close-circle"
        variant="text"
        :width="24"
        :height="24"
        @click.stop="clear"
      />
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
