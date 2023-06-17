<script lang="ts" setup>
import { AFormTextField, cloneDeep } from '@anzusystems/common-admin'
import { useDistributionCategoryOptionValidation } from '@/views/coreDam/distributionCategorySelect/composables/distributionCategoryOptionValidation'
import type { DistributionCategoryOption } from '@/types/coreDam/DistributionCategoryOption'
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    modelValue: DistributionCategoryOption
  }>(),
  {}
)

const emit = defineEmits<{
  (e: 'update:modelValue', data: DistributionCategoryOption): void
  (e: 'remove'): void
}>()

const modelValueComputed = computed({
  get() {
    return props.modelValue
  },
  set(newValue: DistributionCategoryOption) {
    emit('update:modelValue', cloneDeep<DistributionCategoryOption>(newValue))
  },
})

const { v$ } = useDistributionCategoryOptionValidation(modelValueComputed)

onMounted(() => {
  v$.value.$touch()
})

const { t } = useI18n()
</script>

<template>
  <VRow class="mt-5">
    <VCol
      cols="12"
      sm="5"
    >
      <AFormTextField
        v-model="modelValueComputed.name"
        prepend-icon="mdi-drag"
        :v="v$.distributionCategoryOption.name"
        data-cy="ext-system-name"
      />
    </VCol>
    <VCol
      cols="12"
      sm="1"
    >
      <VSwitch
        v-model="modelValueComputed.assignable"
        :label="t('coreDam.distributionCategorySelect.model.assignable')"
      />
    </VCol>
    <VCol
      cols="12"
      sm="6"
    >
      <AFormTextField
        v-model="modelValueComputed.value"
        append-icon="mdi-trash-can-outline"
        :v="v$.distributionCategoryOption.value"
        data-cy="ext-system-name"
        @click:append="emit('remove')"
      />
    </VCol>
  </VRow>
</template>

<style lang="scss">
.v-input__prepend,
.v-input__prepend .v-icon.v-icon.v-icon--link {
  cursor: move;
}
</style>
