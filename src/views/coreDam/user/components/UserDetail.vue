<script lang="ts" setup>
import { ACard, ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useUserOneStore } from '@/stores/dam/userStore'
import LazyExtSystemChip from '@/views/coreDam/extSystem/components/LazyExtSystemChip.vue'
import ExternalProviderAssetChip from '@/views/coreDam/externalProviderAsset/components/ExternalProviderAssetChip.vue'
import DistributionServiceChip from '@/views/coreDam/distribution/components/DistributionServiceChip.vue'
import LazyAssetLicenceChip from '@/views/coreDam/assetLicence/components/LazyAssetLicenceChip.vue'

const { user } = storeToRefs(useUserOneStore())

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ACard loader="detail">
        <ARow :title="t('coreDam.user.model.firstName')" :value="user.firstName" />
        <ARow :title="t('coreDam.user.model.lastName')" :value="user.lastName" />
        <ARow :title="t('coreDam.user.model.assetLicences')">
          <LazyAssetLicenceChip
            v-for="assetLicenceId in user.assetLicences"
            :id="assetLicenceId"
            :key="assetLicenceId"
            class="mr-1"
          />
        </ARow>
        <ARow :title="t('coreDam.user.model.adminToExtSystems')">
          <LazyExtSystemChip
            v-for="adminToExtSystem in user.adminToExtSystems"
            :id="adminToExtSystem"
            :key="adminToExtSystem"
            class="mr-1"
          />
        </ARow>
        <ARow :title="t('coreDam.user.model.userToExtSystems')">
          <LazyExtSystemChip
            v-for="userToExtSystem in user.userToExtSystems"
            :id="userToExtSystem"
            :key="userToExtSystem"
            class="mr-1"
          />
        </ARow>
        <ARow :title="t('coreDam.user.model.allowedAssetExternalProviders')">
          <ExternalProviderAssetChip
            v-for="allowedAssetExternalProvider in user.allowedAssetExternalProviders"
            :key="allowedAssetExternalProvider"
            class="mr-1"
            :provider-name="allowedAssetExternalProvider"
          />
        </ARow>
        <ARow :title="t('coreDam.user.model.allowedAssetExternalProviders')">
          <DistributionServiceChip
            v-for="allowedDistributionService in user.allowedDistributionServices"
            :key="allowedDistributionService"
            class="mr-1"
            :service-name="allowedDistributionService"
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
