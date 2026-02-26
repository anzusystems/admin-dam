<script lang="ts" setup>
import { ABooleanValue, ACopyText, ARow, AUserAndTimeTrackingFields, dateTimePretty } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useAssetLicenceOneStore } from '@/stores/coreDam/assetLicenceStore'
import CachedExtSystemChip from '@/views/coreDam/extSystem/components/CachedExtSystemChip.vue'
import AuthorRemoteAutocompleteCachedAuthorChip from '@/views/coreDam/author/components/AuthorRemoteAutocompleteCachedAuthorChip.vue'
import CachedDamUserChip from '@/components/CachedDamUserChip.vue'

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
      <VDivider class="my-4" />
      <ARow :title="t('coreDam.assetLicence.model.internalRule.active')">
        <ABooleanValue :value="assetLicence.internalRule.active" />
      </ARow>
      <ARow
        v-if="assetLicence.internalRule.markAsInternalSince"
        :title="t('coreDam.assetLicence.model.internalRule.markAsInternalSince')"
        :value="dateTimePretty(assetLicence.internalRule.markAsInternalSince)"
      />
      <ARow
        v-if="assetLicence.internalRuleAuthors.length > 0"
        :title="t('coreDam.assetLicence.model.internalRuleAuthors')"
      >
        <div class="d-flex flex-wrap gap-1">
          <AuthorRemoteAutocompleteCachedAuthorChip
            v-for="authorId in assetLicence.internalRuleAuthors"
            :id="authorId"
            :key="authorId"
          />
        </div>
      </ARow>
      <ARow
        v-if="assetLicence.internalRuleUsers.length > 0"
        :title="t('coreDam.assetLicence.model.internalRuleUsers')"
      >
        <div class="d-flex flex-wrap gap-1">
          <CachedDamUserChip
            v-for="userId in assetLicence.internalRuleUsers"
            :id="userId"
            :key="userId"
          />
        </div>
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
