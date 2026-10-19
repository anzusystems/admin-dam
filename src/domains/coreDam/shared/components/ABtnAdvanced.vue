<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const modelValue = defineModel<boolean>({ required: true })

const { t } = useI18n()

const toggle = () => {
  modelValue.value = !modelValue.value
}
</script>

<template>
  <!-- A button that shows and hides what follows it: pressed by Enter as it goes down and by Space as it comes up, as
       a button is. -->
  <div
    class="cursor-pointer"
    role="button"
    tabindex="0"
    :aria-expanded="modelValue"
    @click.stop="toggle"
    @keydown.enter.prevent.stop="toggle"
    @keyup.enter.prevent.stop
    @keydown.space.prevent.stop
    @keyup.space.prevent.stop="toggle"
  >
    <VIcon
      class="mr-2"
      size="small"
      :icon="modelValue ? 'mdi-chevron-double-up' : 'mdi-chevron-double-down'"
    />
    {{ t('common.button.advanced') }}
  </div>
</template>
