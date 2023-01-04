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
import { createAuthor, ENTITY } from '@/services/api/dam/authorApi'
import { useAuthorFactory } from '@/model/dam/factory/AuthorFactory'
import type { Author } from '@/types/dam/Author'
import { useAuthorValidation } from '@/views/dam/author/composables/authorValidation'
import AValueObjectOptionsSelect from '@/components/form/AValueObjectOptionsSelect.vue'
import { useAuthorType } from '@/model/dam/valueObject/AuthorType'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { ValidationScope } from '@/types/Validation'
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
    btnReset('create')
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
    @click.stop="onClick"
    variant="text"
    size="small"
  >
    <VIcon icon="mdi-plus" />
    <VTooltip activator="parent" location="bottom">Add new author</VTooltip>
  </VBtn>
  <VDialog v-model="dialog" persistent>
    <VCard v-if="dialog" width="500" class="mt-0 mr-auto ml-auto" data-cy="create-panel">
      <VCardTitle class="d-flex pr-2">
        <span>{{ t('coreDam.author.meta.create') }}</span>
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
              :label="t('coreDam.author.model.name')"
              v-model="author.name"
              :v="v$.author.name"
              required
              data-cy="author-name"
            ></ATextField>
          </ARow>
          <ARow>
            <ATextField
              :label="t('coreDam.author.model.identifier')"
              v-model="author.identifier"
              :v="v$.author.identifier"
              data-cy="author-identifier"
            ></ATextField>
          </ARow>
          <ARow>
            <AValueObjectOptionsSelect
              :label="t('coreDam.author.model.type')"
              v-model="author.type"
              :items="authorTypeOptions"
              data-cy="author-type"
            ></AValueObjectOptionsSelect>
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
