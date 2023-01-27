<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import { useI18n } from 'vue-i18n'
import ARow from '@/components/common/ARow.vue'
import ACopyText from '@/components/common/ACopyText.vue'
import { storeToRefs } from 'pinia'
import { useUserOneStore } from '@/stores/dam/userStore'
import ABooleanValue from '@/components/common/ABooleanValue.vue'
import AUserAndTimeTrackingFields from '@/components/common/AUserAndTimeTrackingFields.vue'
import LazyExtSystemChip from '@/views/dam/extSystem/components/LazyExtSystemChip.vue'
import PermissionList from '@/views/dam/permissionGroup/components/PermissionList.vue'
import ExternalProviderAssetChip from '@/views/dam/externalProviderAsset/components/ExternalProviderAssetChip.vue'
import DistributionServiceChip from '@/views/dam/distribution/components/DistributionServiceChip.vue'
import LazyAssetLicenceChip from '@/views/dam/assetLicence/components/LazyAssetLicenceChip.vue'
import { computed } from 'vue'
import { damPubConfig } from '@/services/DamConfigService'
import { UserAuthType } from '@/types/dam/DamConfig'

const { loaded, user } = storeToRefs(useUserOneStore())

const { t } = useI18n({ useScope: 'global' })

const notSuperAdmin = computed(() => !user.value.roles.includes('ROLE_ADMIN'))
const userAuthType = damPubConfig.userAuthType
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ACard loader="detail">
        <ARow :title="t('coreDam.user.model.email')" :value="user.email"></ARow>
        <ARow :title="t('coreDam.user.model.roles')">
          <VChip v-for="role in user.roles" :key="role" size="small">{{ role }}</VChip>
        </ARow>
        <ARow :title="t('coreDam.user.model.assetLicences')">
          <LazyAssetLicenceChip
            class="mr-1"
            v-for="assetLicenceId in user.assetLicences"
            :id="assetLicenceId"
            :key="assetLicenceId"
          ></LazyAssetLicenceChip>
        </ARow>
        <ARow :title="t('coreDam.user.model.adminToExtSystems')">
          <LazyExtSystemChip
            class="mr-1"
            :id="adminToExtSystem"
            :key="adminToExtSystem"
            v-for="adminToExtSystem in user.adminToExtSystems"
          ></LazyExtSystemChip>
        </ARow>
        <ARow :title="t('coreDam.user.model.allowedAssetExternalProviders')">
          <ExternalProviderAssetChip
            class="mr-1"
            :provider-name="allowedAssetExternalProvider"
            :key="allowedAssetExternalProvider"
            v-for="allowedAssetExternalProvider in user.allowedAssetExternalProviders"
          ></ExternalProviderAssetChip>
        </ARow>
        <ARow :title="t('coreDam.user.model.allowedAssetExternalProviders')">
          <DistributionServiceChip
            class="mr-1"
            :service-name="allowedDistributionService"
            :key="allowedDistributionService"
            v-for="allowedDistributionService in user.allowedDistributionServices"
          ></DistributionServiceChip>
        </ARow>
        <ARow :title="t('coreDam.user.model.enabled')">
          <ABooleanValue chip :value="user.enabled"></ABooleanValue>
        </ARow>
      </ACard>
    </VCol>
    <VCol cols="4">
      <ACard loader="detail">
        <ARow :title="t('coreDam.user.model.id')">
          <ACopyText :value="user.id"></ACopyText>
        </ARow>
        <ARow v-if="userAuthType === UserAuthType.OAuth2" :title="t('coreDam.user.model.id')" :value="user.id"></ARow>
        <AUserAndTimeTrackingFields :data="user"></AUserAndTimeTrackingFields>
      </ACard>
    </VCol>
    <VCol cols="12" v-if="notSuperAdmin">
      <ACard loader="detail">
        <ARow>
          <PermissionList v-if="loaded" v-model="user.permissions" readonly></PermissionList>
        </ARow>
      </ACard>
    </VCol>
  </VRow>
</template>
