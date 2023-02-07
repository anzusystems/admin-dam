<script setup lang="ts">
import type { LocaleCode } from '@/composables/system/localeSettings'
import { computed } from 'vue'
import FlagSk from '@/components/common/flags/FlagSk.vue'
import FlagEn from '@/components/common/flags/FlagEn.vue'
import FlagEmpty from '@/components/common/flags/FlagEmpty.vue'

// flag source: https://github.com/hampusborgos/country-flags

const props = withDefaults(
  defineProps<{
    code?: LocaleCode | undefined
  }>(),
  {
    code: 'xx',
  }
)

const currentFlagComponent = computed(() => {
  switch (props.code) {
    case 'sk':
      return FlagSk
    case 'en':
      return FlagEn
    default:
      return FlagEmpty
  }
})
</script>

<template>
  <div class="flag">
    <component :is="currentFlagComponent" />
  </div>
</template>
