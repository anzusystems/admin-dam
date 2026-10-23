<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

withDefaults(defineProps<{}>(), {})

const emit = defineEmits<{ submit: [] }>()

const modelValue = defineModel<string | null>({ required: true })

const { t } = useI18n()

const modelValueComputed = computed({
  get() {
    return modelValue.value ?? ''
  },
  set(newValue: string) {
    modelValue.value = newValue
  },
})
</script>

<template>
  <VTextField
    v-model="modelValueComputed"
    variant="outlined"
    :placeholder="t('system.mainBar.search')"
    hide-details
    class="mr-2 v-text-field--pill"
    density="compact"
    color="grey"
    clearable
  >
    <template #append-inner>
      <!-- A button: pressed by Enter as it goes down and by Space as it comes up. Neither key goes on to the field or its
           form, so that it searches once. -->
      <VIcon
        :aria-label="t('system.mainBar.search')"
        icon="mdi-magnify"
        @click="emit('submit')"
        @keydown.enter.prevent.stop="emit('submit')"
        @keyup.enter.prevent.stop
        @keydown.space.prevent.stop
        @keyup.space.prevent.stop="emit('submit')"
      />
    </template>
  </VTextField>
</template>

<style lang="scss" scoped>
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables.scss' as vars;

.v-text-field--pill {
  min-width: 120px;

  @media #{map.get(vars.$display-breakpoints, 'sm-and-up')} {
    min-width: 300px;
  }
}
</style>
