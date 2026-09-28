<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionDeleteButton,
  AActionEditButton,
  ACard,
  defineBreadcrumbs,
  stringToInt,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import PublicExportDetail from '@/domains/coreDam/publicExport/components/PublicExportDetail.vue'
import {
  usePublicExportDetailActions,
  usePublicExportRemoveActions,
} from '@/domains/coreDam/publicExport/composables/publicExportActions'
import { ACL } from '@/domains/system/auth/auth'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const { detailLoading, fetchData, resetStore, publicExport } = usePublicExportDetailActions()
const { removePublicExport } = usePublicExportRemoveActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.publicExport.list'), routeName: '/(coreDam)/public-exports' },
    {
      title: publicExport.value.slug || t('breadcrumb.coreDam.publicExport.detail'),
      routeName: '/(coreDam)/public-exports/[id]',
    },
  ])
)

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const getDetail = () => {
  fetchData(id)
}

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl :permission="ACL.DAM_PUBLIC_EXPORT_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :route-params="{ id: id }"
          :route-name="'/(coreDam)/public-exports/[id]/edit'"
        />
      </Acl>
      <Acl :permission="ACL.DAM_PUBLIC_EXPORT_UPDATE">
        <AActionDeleteButton
          v-if="!detailLoading"
          data-cy="button-delete"
          @delete-record="removePublicExport(id)"
        />
      </Acl>
      <AActionCloseButtonHistory
        :fallback-route-name="'/(coreDam)/public-exports'"
        :skip-route-names="['/(coreDam)/public-exports/[id]/edit']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <PublicExportDetail />
    </VCardText>
  </ACard>
</template>
