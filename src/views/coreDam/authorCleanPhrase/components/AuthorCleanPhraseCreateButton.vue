<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ACreateDialog,
  AFormTextField,
  AFormValueObjectOptionsSelect,
  ARow,
  ASystemEntityScope,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { createAuthorCleanPhrase, ENTITY } from '@/services/api/coreDam/AuthorCleanPhraseApi'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { useAuthorCleanPhraseFactory } from '@/model/coreDam/factory/AuthorCleanPhraseFactory'
import type { AuthorCleanPhrase } from '@/types/coreDam/AuthorCleanPhrase'
import { useAuthorCleanPhraseValidation } from '@/views/coreDam/authorCleanPhrase/composables/authorCleanPhraseValidation'
import { useAuthorCleanPhraseTypeTypes } from '@/model/coreDam/valueObject/AuthorCleanPhraseType'
import { useAuthorCleanPhraseModeTypes } from '@/model/coreDam/valueObject/AuthorCleanPhraseMode'
import AuthorRemoteAutocomplete from '@/views/coreDam/author/components/AuthorRemoteAutocomplete.vue'

withDefaults(
  defineProps<{
    buttonClass?: string
    dataCy?: string
  }>(),
  {
    buttonClass: 'ml-2',
    dataCy: '',
  }
)
const emit = defineEmits<{
  (e: 'onSuccess', data: AuthorCleanPhrase): void
}>()

const { currentExtSystemId } = useCurrentExtSystem()

const { createDefault } = useAuthorCleanPhraseFactory()
const authorCleanPhrase = ref<AuthorCleanPhrase>(createDefault(currentExtSystemId.value))
const dialog = ref(false)

const { v$ } = useAuthorCleanPhraseValidation(authorCleanPhrase)
const { t } = useI18n()

const onOpen = () => {
  authorCleanPhrase.value = createDefault(currentExtSystemId.value)
}

const create = async () => {
  return await createAuthorCleanPhrase(authorCleanPhrase.value)
}

const { authorCleanPhraseTypeOptions } = useAuthorCleanPhraseTypeTypes()
const { authorCleanPhraseModeOptions } = useAuthorCleanPhraseModeTypes()
</script>

<template>
  <ACreateDialog
    v-model="dialog"
    :v="v$"
    :call-create="create"
    disable-redirect
    :button-class="buttonClass"
    :data-cy="dataCy"
    :max-width="500"
    @on-open="onOpen"
    @on-success="emit('onSuccess', $event)"
    @on-close="dialog = false"
  >
    <template #button-title>
      {{ t('coreDam.authorCleanPhrase.button.create') }}
    </template>
    <template #title>
      {{ t('coreDam.authorCleanPhrase.meta.create') }}
    </template>
    <template #content>
      <ASystemEntityScope
        :system="SYSTEM_CORE_DAM"
        :subject="ENTITY"
      >
        <ARow>
          <AFormTextField
            v-model="authorCleanPhrase.phrase"
            :label="t('coreDam.authorCleanPhrase.model.phrase')"
            :v="v$.authorCleanPhrase.phrase"
            data-cy="authorCleanPhrase-phrase"
          />
        </ARow>
        <ARow>
          <AFormValueObjectOptionsSelect
            v-model="authorCleanPhrase.type"
            :label="t('coreDam.authorCleanPhrase.model.type')"
            :items="authorCleanPhraseTypeOptions"
            data-cy="authorCleanPhrase-type"
          />
        </ARow>
        <ARow>
          <AFormValueObjectOptionsSelect
            v-model="authorCleanPhrase.mode"
            :label="t('coreDam.authorCleanPhrase.model.mode')"
            :items="authorCleanPhraseModeOptions"
            data-cy="authorCleanPhrase-mode"
          />
        </ARow>
        <ARow>
          <VCol>
            <VSwitch
              v-model="authorCleanPhrase.flags.wordBoundary"
              :label="t('coreDam.authorCleanPhrase.model.flags.wordBoundary')"
              hide-details
              data-cy="authorCleanPhrase-wordBoundary"
            />
          </VCol>
        </ARow>
        <ARow>
          <AFormTextField
            v-model="authorCleanPhrase.position"
            :label="t('coreDam.authorCleanPhrase.model.position')"
            :v="v$.authorCleanPhrase.position"
            type="number"
            :step="1"
            data-cy="authorCleanPhrase-position"
          />
        </ARow>
        <ARow>
          <AuthorRemoteAutocomplete
            v-model="authorCleanPhrase.authorReplacement"
            :label="t('coreDam.authorCleanPhrase.model.authorReplacement')"
            data-cy="authorCleanPhrase-authorReplacement"
          />
        </ARow>
      </ASystemEntityScope>
    </template>
  </ACreateDialog>
</template>
