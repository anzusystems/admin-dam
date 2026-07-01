<script lang="ts" setup>
import { ABooleanValue, ACopyText, ARow, AUserAndTimeTrackingFields, dateTimePretty } from '@anzusystems/common-admin'
import { useAssetLicenceOneStore } from '@/domains/coreDam/assetLicence/store/assetLicenceStore'
import CachedExtSystemChip from '@/domains/coreDam/extSystem/components/CachedExtSystemChip.vue'
import AuthorRemoteAutocompleteCachedAuthorChip from '@/domains/coreDam/author/components/AuthorRemoteAutocompleteCachedAuthorChip.vue'
import CachedDamUserChip from '@/domains/coreDam/shared/components/CachedDamUserChip.vue'

const { assetLicence } = storeToRefs(useAssetLicenceOneStore())

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow
        :title="t('coreDam.assetLicence.model.name')"
        :value="assetLicence.name"
      />
      <ARow
        :title="t('coreDam.assetLicence.model.extId')"
        :value="assetLicence.extId"
      />
      <ARow :title="t('coreDam.assetLicence.model.extSystem')">
        <CachedExtSystemChip :id="assetLicence.extSystem" />
      </ARow>
      <ARow :title="t('coreDam.assetLicence.model.internalRule.active')">
        <ABooleanValue :value="assetLicence.internalRule.active" />
      </ARow>
      <ARow
        v-if="assetLicence.internalRule.markAsInternalSince"
        :title="t('coreDam.assetLicence.model.internalRule.markAsInternalSince')"
        :value="dateTimePretty(assetLicence.internalRule.markAsInternalSince)"
      />
      <ARow :title="t('coreDam.assetLicence.model.internalRuleAuthors')">
        <AuthorRemoteAutocompleteCachedAuthorChip
          v-for="authorId in assetLicence.internalRuleAuthors"
          :id="authorId"
          :key="authorId"
          class="mr-2 mt-2"
        />
      </ARow>
      <ARow :title="t('coreDam.assetLicence.model.internalRuleUsers')">
        <CachedDamUserChip
          v-for="userId in assetLicence.internalRuleUsers"
          :id="userId"
          :key="userId"
          class="mr-2 mt-2"
        />
      </ARow>
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.assetLicence.model.id')">
        <ACopyText :value="assetLicence.id" />
      </ARow>
      <AUserAndTimeTrackingFields :data="assetLicence" />
    </VCol>
  </VRow>
</template>
