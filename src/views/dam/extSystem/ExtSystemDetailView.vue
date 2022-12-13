<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { toInt } from '@/utils/string'
import { onBeforeUnmount, onMounted } from 'vue'
import ACloseButton from '@/components/common/buttons/action/ACloseButton.vue'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import ExtSystemDetail from '@/views/dam/extSystem/components/ExtSystemDetail.vue'
import { useExtSystemDetailActions } from '@/views/dam/extSystem/composables/extSystemActions'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import AEditButton from '@/components/common/buttons/action/AEditButton.vue'
import { ACL } from '@/types/Permission'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'

const { loaded, fetchData, resetStore } = useExtSystemDetailActions()

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

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.extSystem.meta.detail')" icon="mdi-folder-account-outline" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_EXT_SYSTEM_UPDATE">
      <AEditButton v-if="loaded" :record-id="id" :route-name="ROUTE.DAM.EXT_SYSTEM.EDIT"></AEditButton>
    </Acl>
    <ACloseButton :route-name="ROUTE.DAM.EXT_SYSTEM.LIST"></ACloseButton>
  </ActionbarButtonsWrapper>
  <ExtSystemDetail></ExtSystemDetail>
</template>
