<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import { useI18n } from 'vue-i18n'
import ARow from '@/components/common/ARow.vue'
import ACopyText from '@/components/common/ACopyText.vue'
import { storeToRefs } from 'pinia'
import { useUserOneStore } from '@/stores/dam/userStore'
import AUserAndTimeTrackingFields from '@/components/common/AUserAndTimeTrackingFields.vue'
import LazyExtSystemChip from '@/views/dam/extSystem/components/LazyExtSystemChip.vue'
import ExternalProviderAssetChip from '@/views/dam/externalProviderAsset/components/ExternalProviderAssetChip.vue'
import DistributionServiceChip from '@/views/dam/distribution/components/DistributionServiceChip.vue'
import LazyAssetLicenceChip from '@/views/dam/assetLicence/components/LazyAssetLicenceChip.vue'

const { user } = storeToRefs(useUserOneStore())

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ACard loader="detail">
        <ARow :title="t('coreDam.user.model.firstName')" :value="user.firstName" />
        <ARow :title="t('coreDam.user.model.lastName')" :value="user.lastName" />
        <ARow :title="t('coreDam.user.model.assetLicences')">
          <LazyAssetLicenceChip
            class="mr-1"
            v-for="assetLicenceId in user.assetLicences"
            :id="assetLicenceId"
            :key="assetLicenceId"
          />
        </ARow>
        <ARow :title="t('coreDam.user.model.adminToExtSystems')">
          <LazyExtSystemChip
            class="mr-1"
            :id="adminToExtSystem"
            :key="adminToExtSystem"
            v-for="adminToExtSystem in user.adminToExtSystems"
          />
        </ARow>
        <ARow :title="t('coreDam.user.model.userToExtSystems')">
          <LazyExtSystemChip
            class="mr-1"
            :id="userToExtSystem"
            :key="userToExtSystem"
            v-for="userToExtSystem in user.userToExtSystems"
          />
        </ARow>
        <ARow :title="t('coreDam.user.model.allowedAssetExternalProviders')">
          <ExternalProviderAssetChip
            class="mr-1"
            :provider-name="allowedAssetExternalProvider"
            :key="allowedAssetExternalProvider"
            v-for="allowedAssetExternalProvider in user.allowedAssetExternalProviders"
          />
        </ARow>
        <ARow :title="t('coreDam.user.model.allowedAssetExternalProviders')">
          <DistributionServiceChip
            class="mr-1"
            :service-name="allowedDistributionService"
            :key="allowedDistributionService"
            v-for="allowedDistributionService in user.allowedDistributionServices"
          />
        </ARow>
      </ACard>
    </VCol>
    <VCol cols="4">
      <ACard loader="detail">
        <ARow :title="t('coreDam.user.model.id')">
          <ACopyText :value="user.id" />
        </ARow>
        <ARow :title="t('coreDam.user.model.email')" :value="user.email" />
        <AUserAndTimeTrackingFields :data="user" />
      </ACard>
    </VCol>
  </VRow>
</template>
