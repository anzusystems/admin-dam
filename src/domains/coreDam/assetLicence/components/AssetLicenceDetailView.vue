<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionEditButton,
  ACard,
  defineBreadcrumbs,
  stringToInt,
  useRecordPage,
} from '@anzusystems/common-admin'
import { onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import AssetLicenceDetail from '@/domains/coreDam/assetLicence/components/AssetLicenceDetail.vue'
import { useAssetLicenceDetailActions } from '@/domains/coreDam/assetLicence/composables/assetLicenceActions'
import { ACL } from '@/domains/system/auth/auth'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const { detailLoading, fetchData, resetStore, assetLicence } = useAssetLicenceDetailActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(() => [
  { title: t('breadcrumb.coreDam.assetLicence.list'), routeName: '/(coreDam)/asset-licences' },
  {
    title: assetLicence.value.name || t('breadcrumb.coreDam.assetLicence.detail'),
    routeName: '/(coreDam)/asset-licences/[id]',
  },
])

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

useRecordPage({
  fallbackRouteName: '/(coreDam)/asset-licences',
  skipRouteNames: ['/(coreDam)/asset-licences/[id]/edit'],
  loading: detailLoading,
  load: (signal) => fetchData(id, { signal }),
})

onBeforeUnmount(resetStore)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl :permission="ACL.DAM_ASSET_LICENCE_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :record-id="id"
          :route-name="'/(coreDam)/asset-licences/[id]/edit'"
        />
      </Acl>
      <AActionCloseButtonHistory
        :fallback-route-name="'/(coreDam)/asset-licences'"
        :skip-route-names="['/(coreDam)/asset-licences/[id]/edit']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AssetLicenceDetail />
    </VCardText>
  </ACard>
</template>
