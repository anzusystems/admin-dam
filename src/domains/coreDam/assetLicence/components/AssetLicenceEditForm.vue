<script lang="ts" setup>
import {
  ADamAuthorRemoteAutocompleteWithCached,
  AFormDatetimePicker,
  AFormTextField,
  ARow,
  ASystemEntityScope,
} from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'

import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { ENTITY } from '@/domains/coreDam/assetLicence/api/assetLicenceApi'
import { useAssetLicenceEditActions } from '@/domains/coreDam/assetLicence/composables/assetLicenceActions'
import {
  BADGE_MAX_LENGTH,
  useAssetLicenceValidation,
} from '@/domains/coreDam/assetLicence/composables/assetLicenceValidation'
import CachedExtSystemChip from '@/domains/coreDam/extSystem/components/CachedExtSystemChip.vue'
import DamTrackingFields from '@/domains/coreDam/shared/components/DamTrackingFields.vue'
import UserRemoteAutocomplete from '@/domains/coreDam/user/components/UserRemoteAutocomplete.vue'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const { assetLicence } = useAssetLicenceEditActions()
// Authors are searched and created in the current ext system, not the licence's own.
const { currentExtSystemId } = useCurrentExtSystem()

const { v$ } = useAssetLicenceValidation(assetLicence)

const { t } = useI18n()
</script>

<template>
  <ASystemEntityScope
    :system="SYSTEM_CORE_DAM"
    :subject="ENTITY"
  >
    <VRow>
      <VCol
        cols="12"
        md="8"
      >
        <ARow>
          <AFormTextField
            v-model="assetLicence.name"
            :label="t('coreDam.assetLicence.model.name')"
            :v="v$.assetLicence.name"
            data-cy="asset-licence-name"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="assetLicence.extId"
            :label="t('coreDam.assetLicence.model.extId')"
            :v="v$.assetLicence.extId"
            data-cy="asset-licence-ext-id"
          />
        </ARow>
        <ARow>
          <AFormTextField
            :model-value="assetLicence.badge"
            :label="t('coreDam.assetLicence.model.badge')"
            :v="v$.assetLicence.badge"
            :maxlength="BADGE_MAX_LENGTH"
            data-cy="asset-licence-badge"
            @update:model-value="assetLicence.badge = String($event ?? '').toUpperCase()"
          />
        </ARow>
        <ARow :title="t('coreDam.assetLicence.model.extSystem')">
          <CachedExtSystemChip
            :id="assetLicence.extSystem"
            data-cy="asset-licence-ext-system"
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="assetLicence.flags.manualUploadAllowed"
            class="pl-2"
            :label="t('coreDam.assetLicence.model.flags.manualUploadAllowed')"
            data-cy="asset-licence-manual-upload-allowed"
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="assetLicence.flags.directUseAllowed"
            class="pl-2"
            :label="t('coreDam.assetLicence.model.flags.directUseAllowed')"
            data-cy="asset-licence-direct-use-allowed"
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="assetLicence.flags.singleUseEnforced"
            class="pl-2"
            :label="t('coreDam.assetLicence.model.flags.singleUseEnforced')"
            :hint="t('coreDam.assetLicence.model.flags.singleUseEnforcedHint')"
            persistent-hint
            data-cy="asset-licence-single-use-enforced"
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="assetLicence.autoDelete.active"
            class="pl-2"
            :label="t('coreDam.assetLicence.model.autoDelete.active')"
            data-cy="asset-licence-auto-delete-active"
          />
        </ARow>
        <ARow v-if="assetLicence.autoDelete.active">
          <AFormTextField
            v-model="assetLicence.autoDelete.olderThanDays"
            :label="t('coreDam.assetLicence.model.autoDelete.olderThanDays')"
            :v="v$.assetLicence.autoDelete.olderThanDays"
            type="number"
            :step="1"
            data-cy="asset-licence-auto-delete-older-than-days"
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="assetLicence.internalRule.active"
            class="pl-2"
            :label="t('coreDam.assetLicence.model.internalRule.active')"
            data-cy="asset-licence-internal-rule-active"
          />
        </ARow>
        <ARow>
          <AFormDatetimePicker
            v-model="assetLicence.internalRule.markAsInternalSince"
            :label="t('coreDam.assetLicence.model.internalRule.markAsInternalSince')"
            clearable
            data-cy="asset-licence-internal-rule-mark-as-internal-since"
          />
        </ARow>
        <ARow>
          <ADamAuthorRemoteAutocompleteWithCached
            v-model="assetLicence.internalRuleAuthors"
            :ext-system="currentExtSystemId"
            :label="t('coreDam.assetLicence.model.internalRuleAuthors')"
            :validation-scope="false"
            multiple
            clearable
            data-cy="asset-licence-internal-rule-authors"
          />
        </ARow>
        <ARow>
          <UserRemoteAutocomplete
            v-model="assetLicence.internalRuleUsers"
            :label="t('coreDam.assetLicence.model.internalRuleUsers')"
            multiple
            data-cy="asset-licence-internal-rule-users"
          />
        </ARow>
        <ARow>
          <ADamAuthorRemoteAutocompleteWithCached
            v-model="assetLicence.defaultSource"
            :ext-system="currentExtSystemId"
            :label="t('coreDam.assetLicence.model.defaultSource')"
            :validation-scope="false"
            source
            clearable
            data-cy="asset-licence-default-source"
          />
        </ARow>
        <DamTrackingFields :data="assetLicence" />
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
