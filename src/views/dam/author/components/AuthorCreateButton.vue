<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAlerts } from '@anzusystems/common-admin'
import { useErrorHandler } from '@anzusystems/common-admin'
import { isUndefined } from '@/utils/common'
import { ROUTE } from '@/router/routes'
import { AFormTextField } from '@anzusystems/common-admin'
import { ARow } from '@anzusystems/common-admin'
import { ASystemEntityScope, AFormValueObjectOptionsSelect } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { createAuthor, ENTITY } from '@/services/api/dam/authorApi'
import { useAuthorFactory } from '@/model/dam/factory/AuthorFactory'
import type { Author } from '@/types/dam/Author'
import { useAuthorValidation } from '@/views/dam/author/composables/authorValidation'
import { useAuthorType } from '@/model/dam/valueObject/AuthorType'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import type { ValidationScope } from '@/types/Validation'
import { AuthorCreateValidationScopeSymbol } from '@/components/validationScopes'

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
    validationScope: AuthorCreateValidationScopeSymbol,
  }
)
const emit = defineEmits<{
  (e: 'afterCreate', data: Author): void
}>()

const { currentExtSystemId } = useCurrentExtSystem()

const { createDefault } = useAuthorFactory()
const author = ref<Author>(createDefault(currentExtSystemId.value))
const dialog = ref(false)
const buttonLoading = ref(false)

const onClick = () => {
  author.value = createDefault(currentExtSystemId.value, true)
  author.value.name = props.initialValue
  dialog.value = true
}

const onCancel = () => {
  dialog.value = false
}

const router = useRouter()
const { v$ } = useAuthorValidation(author, props.validationScope)
const { t } = useI18n()
const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

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
    const res = await createAuthor(author.value)
    emit('afterCreate', res)
    showRecordWas('created')
    dialog.value = false
    if (!isUndefined(res.id) && !props.disableRedirect) {
      router.push({ name: ROUTE.DAM.AUTHOR.DETAIL, params: { id: res.id } })
    }
  } catch (error) {
    handleError(error)
  } finally {
    buttonLoading.value = false
  }
}

const { authorTypeOptions } = useAuthorType()
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
    variant="text"
    size="small"
    @click.stop="onClick"
  >
    <VIcon icon="mdi-plus" />
    <VTooltip activator="parent" location="bottom">{{ t('coreDam.author.button.add') }}</VTooltip>
  </VBtn>
  <VDialog v-model="dialog" persistent>
    <VCard v-if="dialog" width="500" class="mt-0 mr-auto ml-auto" data-cy="create-panel">
      <VCardTitle class="d-flex pr-2">
        <span>{{ t('coreDam.author.meta.create') }}</span>
        <VSpacer />
        <VBtn class="ml-2" icon="mdi-close" size="small" variant="text" data-cy="button-close" @click.stop="onCancel" />
      </VCardTitle>
      <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
        <VContainer class="pa-4" fluid>
          <ARow>
            <AFormTextField
              v-model="author.name"
              :label="t('coreDam.author.model.name')"
              :v="v$.author.name"
              required
              data-cy="author-name"
              @keyup.enter="onConfirm"
            />
          </ARow>
          <ARow>
            <AFormTextField
              v-model="author.identifier"
              :label="t('coreDam.author.model.identifier')"
              :v="v$.author.identifier"
              data-cy="author-identifier"
              @keyup.enter="onConfirm"
            />
          </ARow>
          <ARow>
            <AFormValueObjectOptionsSelect
              v-model="author.type"
              :label="t('coreDam.author.model.type')"
              :items="authorTypeOptions"
              data-cy="author-type"
              @keyup.enter="onConfirm"
            />
          </ARow>
        </VContainer>
      </ASystemEntityScope>
      <VCardActions>
        <VSpacer />
        <VBtn color="secondary" variant="text" data-cy="button-cancel" @click.stop="onCancel">
          {{ t('common.button.cancel') }}
        </VBtn>
        <VBtn color="success" btn-helper="create" data-cy="button-confirm" @click.stop="onConfirm">
          {{ t(buttonT) }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
