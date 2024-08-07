<script lang="ts" setup>
import { ACopyText, ARow, AUserAndTimeTrackingFields, COMMON_CONFIG } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useUserOneStore } from '@/stores/coreDam/userStore'
import CachedExtSystemChip from '@/views/coreDam/extSystem/components/CachedExtSystemChip.vue'
import ExternalProviderAssetChip from '@/views/coreDam/externalProviderAsset/components/ExternalProviderAssetChip.vue'
import DistributionServiceChip from '@/views/coreDam/distribution/components/DistributionServiceChip.vue'
import CachedAssetLicenceChip from '@/views/coreDam/assetLicence/components/CachedAssetLicenceChip.vue'
import { ROUTE } from '@/router/routes'

const { user, userAssetLicenceGroups } = storeToRefs(useUserOneStore())

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow :title="t('coreDam.user.model.licenceGroups')">
        <VChip
          v-for="userAssetLicenceGroup in userAssetLicenceGroups"
          :key="userAssetLicenceGroup.id"
          :append-icon="COMMON_CONFIG.CHIP.ICON.LINK"
          label
          size="small"
          class="mr-1"
          :to="{ name: ROUTE.DAM.ASSET_LICENCE_GROUP.DETAIL, params: { id: userAssetLicenceGroup.id } }"
        >
          {{ userAssetLicenceGroup.name }}
        </VChip>
      </ARow>
      <ARow :title="t('coreDam.user.model.assetLicences')">
        <CachedAssetLicenceChip
          v-for="assetLicenceId in user.assetLicences"
          :id="assetLicenceId"
          :key="assetLicenceId"
          class="mr-1"
        />
      </ARow>
      <ARow :title="t('coreDam.user.model.adminToExtSystems')">
        <CachedExtSystemChip
          v-for="adminToExtSystem in user.adminToExtSystems"
          :id="adminToExtSystem"
          :key="adminToExtSystem"
          class="mr-1"
        />
      </ARow>
      <ARow :title="t('coreDam.user.model.userToExtSystems')">
        <CachedExtSystemChip
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
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.user.model.id')">
        <ACopyText :value="user.id" />
      </ARow>
      <ARow
        :title="t('coreDam.user.model.email')"
        :value="user.email"
      />
      <AUserAndTimeTrackingFields :data="user" />
    </VCol>
  </VRow>
</template>
