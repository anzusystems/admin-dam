<script lang="ts" setup>
import { AFormTextField, ARow, useValidate } from '@anzusystems/common-admin'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import useVuelidate from '@vuelidate/core'

export interface LinkData {
  href: string
  nofollow: boolean
}

const props = withDefaults(
  defineProps<{
    required?: boolean
    nofollowEnabled?: boolean
    nofollowDisabledText?: string
  }>(),
  {
    required: false,
    nofollowEnabled: true,
    nofollowDisabledText: '',
  }
)

const link = defineModel<LinkData>('link', { required: true })

const { t } = useI18n()

const { required: requiredValidator, url } = useValidate()

const rules = computed(() => {
  return {
    href: {
      required: props.required ? requiredValidator : () => true,
      url,
    },
  }
})

const v$ = useVuelidate(rules, link, { $stopPropagation: true })

const validate = async (): Promise<boolean> => {
  v$.value.$touch()
  return !v$.value.$invalid
}

const resetValidate = () => {
  v$.value.$reset()
}

const urlInput = ref<InstanceType<typeof AFormTextField> | null>(null)

const focusFirst = () => {
  urlInput.value?.focus()
}

defineExpose({
  validate,
  resetValidate,
  focusFirst,
})
</script>

<template>
  <ARow>
    <AFormTextField
      ref="urlInput"
      v-model="link.href"
      :label="t('common.model.url')"
      :v="v$.href"
      :required="required"
    />
  </ARow>
  <ARow v-if="nofollowEnabled">
    <VSwitch
      v-model="link.nofollow"
      :label="t('common.model.nofollow')"
      class="mt-0"
    />
  </ARow>
  <ARow
    v-else-if="nofollowDisabledText.length > 0"
    class="text-caption"
  >
    {{ nofollowDisabledText }}
  </ARow>
</template>
