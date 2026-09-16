<script lang="ts" setup>
withDefaults(defineProps<{}>(), {})

const emit = defineEmits<{
  (e: 'submit'): void
}>()

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
      <VIcon
        icon="mdi-magnify"
        @click="emit('submit')"
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
