<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const modelValue = defineModel<boolean>({ required: true })

const { t } = useI18n()
</script>

<template>
  <div
    class="cursor-pointer"
    @click.stop="modelValue = !modelValue"
  >
    <VIcon
      class="mr-2"
      size="small"
      :icon="modelValue ? 'mdi-chevron-double-up' : 'mdi-chevron-double-down'"
    />
    {{ t('common.button.advanced') }}
  </div>
</template>
