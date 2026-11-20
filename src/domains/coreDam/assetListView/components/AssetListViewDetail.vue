<script lang="ts" setup>
import { ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useAssetListViewOneStore } from '@/domains/coreDam/assetListView/store/assetListViewStore'
import CachedExtSystemChip from '@/domains/coreDam/extSystem/components/CachedExtSystemChip.vue'
import CachedAssetLicenceGroupChip from '@/domains/coreDam/assetLicenceGroup/components/CachedAssetLicenceGroupChip.vue'
import CachedAssetLicenceChip from '@/domains/coreDam/assetLicence/components/CachedAssetLicenceChip.vue'

const { assetListView } = storeToRefs(useAssetListViewOneStore())

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow
        :title="t('coreDam.assetListView.model.name')"
        :value="assetListView.name"
      />
      <ARow :title="t('coreDam.assetListView.model.extSystem')">
        <CachedExtSystemChip :id="assetListView.extSystem" />
      </ARow>
      <ARow
        :title="t('coreDam.assetListView.model.position')"
        :value="assetListView.position"
      />
      <ARow :title="t('coreDam.assetListView.model.groups')">
        <CachedAssetLicenceGroupChip
          v-for="assetLicenceGroupId in assetListView.groups"
          :id="assetLicenceGroupId"
          :key="assetLicenceGroupId"
          class="mr-1"
        />
      </ARow>
      <ARow :title="t('coreDam.assetListView.model.licences')">
        <CachedAssetLicenceChip
          v-for="assetLicenceId in assetListView.licences"
          :id="assetLicenceId"
          :key="assetLicenceId"
          class="mr-1"
        />
      </ARow>
      <ARow :title="t('coreDam.assetListView.model.uploadLicence')">
        <CachedAssetLicenceChip :id="assetListView.uploadLicence" />
      </ARow>
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.assetListView.model.id')">
        <ACopyText :value="assetListView.id" />
      </ARow>
      <AUserAndTimeTrackingFields :data="assetListView" />
    </VCol>
  </VRow>
</template>
