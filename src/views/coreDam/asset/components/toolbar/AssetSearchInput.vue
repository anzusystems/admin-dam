<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    modelValue: string | null
  }>(),
  {
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', data: string): void
  (e: 'submit'): void
}>()

const modelValueComputed = computed({
  get() {
    return props.modelValue
  },
  set(newValue: string) {
    emit('update:modelValue', newValue)
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
      <VIcon
        icon="mdi-magnify"
        @click="emit('submit')"
      />
    </template>
  </VTextField>
</template>

<style lang="scss" scoped>
@use 'vuetify/lib/styles/settings/_variables.scss' as vars;

.v-text-field--pill {
  min-width: 120px;

  @media #{map-get(vars.$display-breakpoints, 'sm-and-up')} {
    min-width: 300px;
  }
}
</style>
