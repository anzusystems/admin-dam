<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/assetLicenceApi'
import { useI18n } from 'vue-i18n'
import { AFormDatetimePicker, AFormTextField, ARow, ASystemEntityScope, DamExtSystemRemoteAutocomplete } from '@anzusystems/common-admin'
import { useAssetLicenceEditActions } from '@/views/coreDam/assetLicence/composables/assetLicenceActions'
import { useAssetLicenceValidation } from '@/views/coreDam/assetLicence/composables/assetLicenceValidation'
import { damClient } from '@/services/api/clients/damClient'
import AuthorRemoteAutocomplete from '@/views/coreDam/author/components/AuthorRemoteAutocomplete.vue'
import UserRemoteAutocomplete from '@/views/coreDam/user/components/UserRemoteAutocomplete.vue'

const { assetLicence } = useAssetLicenceEditActions()

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
          <DamExtSystemRemoteAutocomplete
            v-model="assetLicence.extSystem"
            :client="damClient"
            :label="t('coreDam.assetLicence.model.extSystem')"
            :v="v$.assetLicence.extSystem"
            data-cy="asset-licence-ext-system"
          />
        </ARow>
        <VDivider class="my-4" />
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
          <ASystemEntityScope
            subject="author"
            system="dam"
          >
            <AuthorRemoteAutocomplete
              v-model="assetLicence.internalRuleAuthors"
              :label="t('coreDam.assetLicence.model.internalRuleAuthors')"
              multiple
              data-cy="asset-licence-internal-rule-authors"
            />
          </ASystemEntityScope>
        </ARow>
        <ARow>
          <UserRemoteAutocomplete
            v-model="assetLicence.internalRuleUsers"
            :label="t('coreDam.assetLicence.model.internalRuleUsers')"
            multiple
            data-cy="asset-licence-internal-rule-users"
          />
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
