<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import ASaveButton from '@/components/common/buttons/action/ASaveButton.vue'
import ASaveAndCloseButton from '@/components/common/buttons/action/ASaveAndCloseButton.vue'
import ACloseButton from '@/components/common/buttons/action/ACloseButton.vue'
import { ROUTE } from '@/router/routes'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { useKeywordEditActions } from '@/views/dam/keyword/composables/keywordActions'
import KeywordEditForm from '@/views/dam/keyword/components/KeywordEditForm.vue'

const { t } = useI18n({ useScope: 'global' })

const route = useRoute()
const id = route.params.id.toString()

const { loaded, fetchData, resetStore, onUpdate } = useKeywordEditActions()

const getData = () => {
  fetchData(id)
}

onMounted(() => {
  getData()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.keyword.meta.edit')" icon="mdi-file-key-outline" />
  <ActionbarButtonsWrapper>
    <ASaveButton v-if="loaded" @save-record="onUpdate"></ASaveButton>
    <ASaveAndCloseButton v-if="loaded" @save-record-and-close="onUpdate(true)"></ASaveAndCloseButton>
    <ACloseButton :route-name="ROUTE.DAM.KEYWORD.LIST"></ACloseButton>
  </ActionbarButtonsWrapper>
  <ACard loader="edit">
    <KeywordEditForm></KeywordEditForm>
  </ACard>
</template>
