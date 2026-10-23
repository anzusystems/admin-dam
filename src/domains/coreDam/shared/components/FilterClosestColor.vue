<script lang="ts" setup>
import {
  FilterConfigKey,
  FilterDataKey,
  arrayItemToggle,
  cloneDeep,
  isArray,
  isUndefined,
  useDamConfigStore,
} from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

import { pickTextColorBasedOnBgColor } from '@/shared/utils/colors'

const props = withDefaults(
  defineProps<{
    name: string
    dataCy?: string
  }>(),
  {
    dataCy: 'filter-color',
  }
)

const filterConfig = inject(FilterConfigKey)
const filterData = inject(FilterDataKey)
if (isUndefined(filterConfig) || isUndefined(filterData)) {
  throw new Error('Incorrect provide/inject config.')
}

const value = computed<string | string[]>({
  get() {
    return (filterData[props.name] ?? '') as string | string[]
  },
  set(newValue) {
    filterData[props.name] = newValue
  },
})

const damConfigStore = useDamConfigStore()
const { damPrvConfig } = storeToRefs(damConfigStore)

const { t, te } = useI18n()

// The name of a colour by the key the configuration gives it; a key the app has no name for is shown as it is.
const colorName = (key: string) => (te('coreDam.asset.color.' + key) ? t('coreDam.asset.color.' + key) : key)

const items = computed(() =>
  Object.keys(damPrvConfig.value.colorSet).map((key) => ({
    name: colorName(key),
    color: damPrvConfig.value.colorSet[key],
    selected: isArray(value.value)
      ? value.value.includes(damPrvConfig.value.colorSet[key])
      : value.value === damPrvConfig.value.colorSet[key],
    iconColor: pickTextColorBasedOnBgColor(damPrvConfig.value.colorSet[key], '#fff', '#000'),
  }))
)

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

const clear = () => {
  value.value = cloneDeep(filterConfig.fields[props.name].default) as string | string[]
}

const label = computed(() => {
  const titleT = filterConfig.fields[props.name].titleT
  return titleT ? t(titleT) : undefined
})
</script>

<template>
  <div class="d-flex flex-column align-left justify-center mb-2">
    <VLabel class="pr-1">
      <span v-if="label">{{ label }}</span>
    </VLabel>
    <div class="color-swatches d-flex flex-wrap">
      <!-- A button, named by the name of its colour: pressed by Enter as it goes down and by Space as it comes up, as a
           button is.
           Neither key goes on to the filter form around it, which searches on Enter. -->
      <div
        v-for="(item, key) in items"
        :key="key"
        class="color-swatches__item pa-1 cursor-pointer position-relative border"
        :class="{ 'color-swatches__item--active': item.selected }"
        :style="{ backgroundColor: item.color }"
        :aria-label="item.name"
        role="button"
        tabindex="0"
        :aria-pressed="item.selected"
        @click.stop="toggleSelected(item.color)"
        @keydown.enter.prevent.stop="toggleSelected(item.color)"
        @keyup.enter.prevent.stop
        @keydown.space.prevent.stop
        @keyup.space.prevent.stop="toggleSelected(item.color)"
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
          {{ item.name }} ({{ item.color }})
        </VTooltip>
      </div>
      <VBtn
        v-show="showClear"
        :aria-label="t('common.button.clear')"
        icon
        variant="text"
        :width="24"
        :height="24"
        @click.stop="clear"
      >
        <VIcon icon="mdi-close-circle" />
        <VTooltip
          activator="parent"
          location="bottom"
        >
          {{ t('common.button.clear') }}
        </VTooltip>
      </VBtn>
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
