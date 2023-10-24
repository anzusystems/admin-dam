<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValidationScope } from '@anzusystems/common-admin'
import {
  ADialogToolbar,
  AFormTextField,
  ARow,
  ASystemEntityScope,
  isUndefined,
  useAlerts,
} from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { createKeyword, ENTITY } from '@/services/api/coreDam/keywordApi'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { useKeywordFactory } from '@/model/coreDam/factory/KeywordFactory'
import type { Keyword } from '@/types/coreDam/Keyword'
import { useKeywordValidation } from '@/views/coreDam/keyword/composables/keywordValidation'
import { KeywordCreateValidationScopeSymbol } from '@/components/validationScopes'

const props = withDefaults(
  defineProps<{
    initialValue?: string
    disableRedirect?: boolean
    variant?: 'button' | 'icon'
    buttonT?: string
    buttonClass?: string
    dataCy?: string
    disabled?: boolean | undefined
    validationScope?: ValidationScope
  }>(),
  {
    initialValue: '',
    disableRedirect: false,
    variant: 'button',
    buttonT: 'common.button.create',
    buttonClass: 'ml-2',
    dataCy: undefined,
    disabled: undefined,
    validationScope: KeywordCreateValidationScopeSymbol,
  }
)
const emit = defineEmits<{
  (e: 'onSuccess', data: Keyword): void
}>()

const { currentExtSystemId } = useCurrentExtSystem()

const { createDefault } = useKeywordFactory()
const keyword = ref<Keyword>(createDefault(currentExtSystemId.value))
const dialog = ref(false)
const buttonLoading = ref(false)

const onClick = () => {
  keyword.value = createDefault(currentExtSystemId.value, true)
  keyword.value.name = props.initialValue
  dialog.value = true
}

const onCancel = () => {
  dialog.value = false
}

const router = useRouter()
const { v$ } = useKeywordValidation(keyword, props.validationScope)
const { t } = useI18n()
const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const onConfirm = async () => {
  if (buttonLoading.value) return
  try {
    buttonLoading.value = true
    v$.value.$touch()
    if (v$.value.$invalid) {
      showValidationError()
      buttonLoading.value = false
      return
    }
    const res = await createKeyword(keyword.value)
    emit('onSuccess', res)
    showRecordWas('created')
    dialog.value = false
    if (!isUndefined(res.id) && !props.disableRedirect) {
      router.push({ name: ROUTE.DAM.KEYWORD.DETAIL, params: { id: res.id } })
    }
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    buttonLoading.value = false
  }
}
</script>

<template>
  <ABtnPrimary
    v-if="variant === 'button'"
    :class="buttonClass"
    :data-cy="dataCy"
    :disabled="disabled"
    rounded="pill"
    @click.stop="onClick"
  >
    {{ t(buttonT) }}
  </ABtnPrimary>
  <VBtn
    v-else
    :class="buttonClass"
    :data-cy="dataCy"
    icon
    :disabled="disabled"
    variant="text"
    size="small"
    @click.stop="onClick"
  >
    <VIcon icon="mdi-plus" />
    <VTooltip
      activator="parent"
      location="bottom"
    >
      {{ t('coreDam.keyword.button.add') }}
    </VTooltip>
  </VBtn>
  <VDialog v-model="dialog">
    <VCard
      v-if="dialog"
      width="500"
      class="mt-0 mr-auto ml-auto"
      data-cy="create-panel"
    >
      <ADialogToolbar @on-cancel="onCancel">
        {{ t('coreDam.keyword.meta.create') }}
      </ADialogToolbar>
      <VCardText>
        <ASystemEntityScope
          :system="SYSTEM_CORE_DAM"
          :subject="ENTITY"
        >
          <ARow>
            <AFormTextField
              v-model="keyword.name"
              :label="t('coreDam.keyword.model.name')"
              :v="v$.keyword.name"
              required
              data-cy="keyword-name"
              @keyup.enter="onConfirm"
            />
          </ARow>
        </ASystemEntityScope>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <ABtnTertiary
          data-cy="button-cancel"
          @click.stop="onCancel"
        >
          {{ t('common.button.cancel') }}
        </ABtnTertiary>
        <ABtnPrimary
          :loading="buttonLoading"
          data-cy="button-confirm"
          @click.stop="onConfirm"
        >
          {{ t(buttonT) }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
