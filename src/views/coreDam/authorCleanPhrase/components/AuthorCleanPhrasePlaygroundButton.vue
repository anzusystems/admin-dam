<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AChipNoLink, ADialogToolbar, AFormTextarea, ARow, useAlerts } from '@anzusystems/common-admin'
import { playground } from '@/services/api/coreDam/AuthorCleanPhraseApi'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { useAuthorCleanPhraseFactory } from '@/model/coreDam/factory/AuthorCleanPhraseFactory'
import type { AuthorCleanResultDto, AuthorNameDto } from '@/types/coreDam/AuthorCleanPhrase'
import { useCachedAuthors } from '@/views/coreDam/author/composables/cachedAuthors'
import AuthorRemoteAutocompleteCachedAuthorChip from '@/views/coreDam/author/components/AuthorRemoteAutocompleteCachedAuthorChip.vue'

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

const { currentExtSystemId } = useCurrentExtSystem()

const { createAuthorNameDto, createAuthorCleanResultDto } = useAuthorCleanPhraseFactory()
const authorNameDto = ref<AuthorNameDto>(createAuthorNameDto())
const authorCleanPhraseRes = ref<AuthorCleanResultDto>(createAuthorCleanResultDto())
const dialog = ref(false)
const buttonLoading = ref(false)

const { showErrorsDefault } = useAlerts()

const { t } = useI18n()

const onOpen = () => {
  authorCleanPhraseRes.value = createAuthorCleanResultDto()
  dialog.value = true
}

const onCancel = () => {
  dialog.value = false
}

const { fetchCachedAuthors, addToCachedAuthors } = useCachedAuthors()

const onConfirm = async () => {
  try {
    buttonLoading.value = true
    authorCleanPhraseRes.value = await playground(currentExtSystemId.value, authorNameDto.value)

    authorCleanPhraseRes.value.authors.forEach((authorId) => {
      addToCachedAuthors(authorId)
    })
    fetchCachedAuthors()
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    buttonLoading.value = false
  }
}
</script>

<template>
  <ABtnTertiary
    prepend-icon="mdi-seesaw"
    class="mr-2"
    data-cy="button-rotate-right"
    @click.stop="onOpen"
  >
    {{ t('coreDam.authorCleanPhrase.button.playground') }}
  </ABtnTertiary>
  <VDialog v-model="dialog">
    <VCard
      v-if="dialog"
      width="500"
      class="mt-0 mr-auto ml-auto"
      data-cy="create-panel"
    >
      <ADialogToolbar @on-cancel="onCancel">
        <slot name="title">
          {{ t('coreDam.authorCleanPhrase.meta.playground') }}
        </slot>
      </ADialogToolbar>
      <VCardText>
        <AFormTextarea
          v-model="authorNameDto.name"
          data-cy="authorCleanPhrase-episode"
          :label="t('coreDam.authorCleanPhrase.dto.name')"
        />
        <ARow :title="t('coreDam.authorCleanPhrase.dto.authorNames')">
          <AChipNoLink
            v-for="authorName in authorCleanPhraseRes.authorNames"
            :key="authorName"
            class="mr-1 mb-1"
          >
            {{ authorName }}
          </AChipNoLink>
        </ARow>
        <ARow :title="t('coreDam.authorCleanPhrase.dto.authors')">
          <AuthorRemoteAutocompleteCachedAuthorChip
            v-for="authorId in authorCleanPhraseRes.authors"
            :id="authorId"
            :key="authorId"
          />
        </ARow>
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
          {{ t('coreDam.authorCleanPhrase.meta.test') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
