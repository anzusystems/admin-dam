<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onBeforeUnmount, onMounted } from 'vue'
import ACloseButton from '@/components/common/buttons/action/ACloseButton.vue'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import AEditButton from '@/components/common/buttons/action/AEditButton.vue'
import { ACL } from '@/types/Permission'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { useAuthorDetailActions } from '@/views/dam/author/composables/authorActions'
import AuthorDetail from '@/views/dam/author/components/AuthorDetail.vue'
import ACard from '@/components/common/ACard.vue'

const { detailLoading, fetchData, resetStore } = useAuthorDetailActions()

const route = useRoute()
const id = route.params.id.toString()

const getDetail = () => {
  fetchData(id)
}

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetStore()
})

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.author.meta.detail')" icon="mdi-account-circle-outline" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_AUTHOR_UPDATE">
      <AEditButton v-if="!detailLoading" :record-id="id" :route-name="ROUTE.DAM.AUTHOR.EDIT" />
    </Acl>
    <ACloseButton :route-name="ROUTE.DAM.AUTHOR.LIST" />
  </ActionbarButtonsWrapper>
  <ACard :loading="detailLoading">
    <AuthorDetail />
  </ACard>
</template>
