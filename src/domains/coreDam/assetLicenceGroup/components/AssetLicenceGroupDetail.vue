<script lang="ts" setup>
import { ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useAssetLicenceGroupOneStore } from '@/domains/coreDam/assetLicenceGroup/store/assetLicenceGroupStore'
import CachedExtSystemChip from '@/domains/coreDam/extSystem/components/CachedExtSystemChip.vue'
import CachedAssetLicenceChip from '@/domains/coreDam/assetLicence/components/CachedAssetLicenceChip.vue'
import CachedAssetListViewChip from '@/domains/coreDam/assetListView/components/CachedAssetListViewChip.vue'
import { useAssetListViewByGroupActions } from '@/domains/coreDam/assetListView/composables/assetListViewActions'
import { ACL, useAuth } from '@/domains/system/auth/auth'

const { assetLicenceGroup } = storeToRefs(useAssetLicenceGroupOneStore())

const { t } = useI18n()
const { can } = useAuth()
const { groupListViewIds, fetchByGroup } = useAssetListViewByGroupActions()

watch(
  () => assetLicenceGroup.value.id,
  (id) => {
    if (id && can(ACL.DAM_ASSET_LIST_VIEW_LIST)) fetchByGroup(id)
  },
  { immediate: true }
)
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow
        :title="t('coreDam.assetLicenceGroup.model.name')"
        :value="assetLicenceGroup.name"
      />
      <ARow :title="t('coreDam.assetLicenceGroup.model.extSystem')">
        <CachedExtSystemChip :id="assetLicenceGroup.extSystem" />
      </ARow>
      <ARow :title="t('coreDam.assetLicenceGroup.model.licences')">
        <CachedAssetLicenceChip
          v-for="assetLicenceId in assetLicenceGroup.licences"
          :id="assetLicenceId"
          :key="assetLicenceId"
          class="mr-1"
        />
      </ARow>
      <Acl :permission="ACL.DAM_ASSET_LIST_VIEW_LIST">
        <ARow :title="t('coreDam.assetLicenceGroup.model.listViews')">
          <CachedAssetListViewChip
            v-for="listViewId in groupListViewIds"
            :id="listViewId"
            :key="listViewId"
            class="mr-1"
          />
          <div class="text-body-small text-medium-emphasis mt-1">
            {{ t('coreDam.assetLicenceGroup.model.listViewsHint') }}
          </div>
        </ARow>
      </Acl>
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.assetLicenceGroup.model.id')">
        <ACopyText :value="assetLicenceGroup.id" />
      </ARow>
      <AUserAndTimeTrackingFields :data="assetLicenceGroup" />
    </VCol>
  </VRow>
</template>
