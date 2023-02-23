<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { toInt } from '@/utils/string'
import { onBeforeUnmount, onMounted } from 'vue'
import { AActionCloseButton } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import ExtSystemDetail from '@/views/dam/extSystem/components/ExtSystemDetail.vue'
import { useExtSystemDetailActions } from '@/views/dam/extSystem/composables/extSystemActions'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { AActionEditButton } from '@anzusystems/common-admin'
import { ACL } from '@/types/Permission'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'

const { detailLoading, fetchData, resetStore } = useExtSystemDetailActions()

const route = useRoute()
const id = toInt(route.params.id)

const getDetail = () => {
  fetchData(id)
}

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetStore()
})

const { t } = useI18n()
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.extSystem.meta.detail')" icon="mdi-folder-account-outline" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_EXT_SYSTEM_UPDATE">
      <AActionEditButton v-if="!detailLoading" :record-id="id" :route-name="ROUTE.DAM.EXT_SYSTEM.EDIT" />
    </Acl>
    <AActionCloseButton :route-name="ROUTE.DAM.EXT_SYSTEM.LIST" />
  </ActionbarButtonsWrapper>
  <ACard :loading="detailLoading">
    <ExtSystemDetail />
  </ACard>
</template>
