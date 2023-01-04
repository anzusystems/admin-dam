<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiHelper } from '@/composables/system/uiHelper'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import { isUndefined } from '@/utils/common'
import { ROUTE } from '@/router/routes'
import ABtn from '@/components/common/buttons/ABtn.vue'
import ATextField from '@/components/form/ATextField.vue'
import ARow from '@/components/common/ARow.vue'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { createKeyword, ENTITY } from '@/services/api/dam/keywordApi'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { useKeywordFactory } from '@/model/dam/factory/KeywordFactory'
import type { Keyword } from '@/types/dam/Keyword'
import { useKeywordValidation } from '@/views/dam/keyword/composables/keywordValidation'
import { ValidationScope } from '@/types/Validation'
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
    dataCy: '',
    disabled: undefined,
    validationScope: KeywordCreateValidationScopeSymbol,
  }
)
const emit = defineEmits<{
  (e: 'afterCreate', data: Keyword): void
}>()

const { currentExtSystemId } = useCurrentExtSystem()

const { createDefault } = useKeywordFactory()
const keyword = ref<Keyword>(createDefault(currentExtSystemId.value))
const dialog = ref(false)

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
const { t } = useI18n({ useScope: 'global' })
const { btnDisable, btnEnable, btnLoadingOn, btnReset } = useUiHelper()
const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const onConfirm = async () => {
  try {
    btnDisable('create')
    v$.value.$touch()
    if (v$.value.$invalid) {
      showValidationError()
      btnEnable('create')
      return
    }
    btnLoadingOn('create')
    const res = await createKeyword(keyword.value)
    emit('afterCreate', res)
    showRecordWas('created')
    dialog.value = false
    if (!isUndefined(res.id) && !props.disableRedirect) {
      router.push({ name: ROUTE.DAM.KEYWORD.DETAIL, params: { id: res.id } })
    }
  } catch (error) {
    handleError(error)
  } finally {
    btnReset('create')
  }
}
</script>

<template>
  <VBtn
    v-if="variant === 'button'"
    :class="buttonClass"
    :data-cy="dataCy"
    color="success"
    :disabled="disabled"
    rounded="pill"
    @click.stop="onClick"
  >
    {{ t(buttonT) }}
  </VBtn>
  <VBtn
    v-else
    :class="buttonClass"
    :data-cy="dataCy"
    icon
    :disabled="disabled"
    @click.stop="onClick"
    variant="text"
    size="small"
  >
    <VIcon icon="mdi-plus" />
    <VTooltip activator="parent" location="bottom">{{ t('coreDam.keyword.button.add') }}</VTooltip>
  </VBtn>
  <VDialog v-model="dialog" persistent>
    <VCard v-if="dialog" width="500" class="mt-0 mr-auto ml-auto" data-cy="create-panel">
      <VCardTitle class="d-flex pr-2">
        <span>{{ t('coreDam.keyword.meta.create') }}</span>
        <VSpacer></VSpacer>
        <VBtn
          class="ml-2"
          icon="mdi-close"
          size="small"
          variant="text"
          @click.stop="onCancel"
          data-cy="button-close"
        ></VBtn>
      </VCardTitle>
      <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
        <VContainer class="pa-4" fluid>
          <ARow>
            <ATextField
              :label="t('coreDam.keyword.model.name')"
              v-model="keyword.name"
              :v="v$.keyword.name"
              required
              data-cy="keyword-name"
            ></ATextField>
          </ARow>
        </VContainer>
      </ASystemEntityScope>
      <VCardActions>
        <VSpacer></VSpacer>
        <VBtn color="secondary" variant="text" @click.stop="onCancel" data-cy="button-cancel">
          {{ t('common.button.cancel') }}
        </VBtn>
        <ABtn color="success" @click.stop="onConfirm" btn-helper="create" data-cy="button-confirm">
          {{ t(buttonT) }}
        </ABtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
