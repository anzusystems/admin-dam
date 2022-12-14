<script lang="ts" setup>
import { ROUTE } from '@/router/routes'
import { envConfig } from '@/services/EnvConfigService'
import { useI18n } from 'vue-i18n'
import { ACL } from '@/types/Permission'
import { useCurrentUser } from '@/composables/system/currentUser'

const { t } = useI18n({ useScope: 'global' })

const { showDevFeature } = useCurrentUser()
</script>

<template>
  <VList>
    <VListItem>
      <VListItemTitle class="text-h6">ADAM</VListItemTitle>
    </VListItem>
  </VList>
  <VList density="compact" nav>
    <VListItem
      :to="{ name: ROUTE.SYSTEM.SETTINGS }"
      prepend-icon="mdi-cog"
      :title="t('sidebar.settings.settings')"
      data-cy="personal-settings"
    ></VListItem>
    <Acl :permission="ACL.DAM_PODCAST_UI">
      <VListItem
        :to="{ name: ROUTE.DAM.PODCAST.LIST }"
        prepend-icon="mdi-podcast"
        :title="t('sidebar.settings.podcasts')"
        data-cy="podcast-settings"
      ></VListItem>
    </Acl>
    <Acl :permission="ACL.DAM_USER_UI">
      <VListItem
        :to="{ name: ROUTE.DAM.USER.LIST }"
        prepend-icon="mdi-account-multiple"
        :title="t('sidebar.settings.users')"
        data-cy="user-settings"
      ></VListItem>
    </Acl>
    <Acl :permission="ACL.DAM_PERMISSION_GROUP_UI">
      <VListItem
        :to="{ name: ROUTE.DAM.PERMISSION_GROUP.LIST }"
        prepend-icon="mdi-folder-account-outline"
        :title="t('sidebar.settings.permissionGroups')"
        data-cy="permission-group-settings"
      ></VListItem>
    </Acl>
    <Acl :permission="ACL.DAM_EXT_SYSTEM_UI">
      <VListItem
        :to="{ name: ROUTE.DAM.EXT_SYSTEM.LIST }"
        prepend-icon="mdi-television-stop"
        :title="t('sidebar.settings.extSystems')"
        data-cy="ext-system-settings"
      ></VListItem>
    </Acl>
    <Acl :permission="ACL.DAM_ASSET_LICENCE_UI">
      <VListItem
        :to="{ name: ROUTE.DAM.ASSET_LICENCE.LIST }"
        prepend-icon="mdi-account-key"
        :title="t('sidebar.settings.assetLicences')"
        data-cy="asset-licence-settings"
      ></VListItem>
    </Acl>
    <Acl :permission="ACL.DAM_AUTHOR_UI">
      <VListItem
        :to="{ name: ROUTE.DAM.AUTHOR.LIST }"
        prepend-icon="mdi-account-circle-outline"
        :title="t('sidebar.settings.authors')"
        data-cy="author-settings"
      ></VListItem>
    </Acl>
    <Acl :permission="ACL.DAM_KEYWORD_UI">
      <VListItem
        :to="{ name: ROUTE.DAM.KEYWORD.LIST }"
        prepend-icon="mdi-file-key-outline"
        :title="t('sidebar.settings.keywords')"
        data-cy="keyword-settings"
      ></VListItem>
    </Acl>
    <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_UI">
      <VListItem
        :to="{ name: ROUTE.DAM.DISTRIBUTION_CATEGORY.LIST }"
        prepend-icon="mdi-folder-edit"
        :title="t('sidebar.settings.distributionCategory')"
        data-cy="distribution-category-settings"
      ></VListItem>
    </Acl>
    <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_UI">
      <VListItem
        :to="{ name: ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.LIST }"
        prepend-icon="mdi-form-dropdown"
        :title="t('sidebar.settings.distributionCategorySelect')"
        data-cy="distribution-category-select-settings"
      ></VListItem>
    </Acl>
    <Acl :permission="ACL.ADMIN_LOG_UI">
      <VListItem
        :to="{ name: ROUTE.COMMON.LOG.LIST }"
        prepend-icon="mdi-math-log"
        :title="t('sidebar.settings.log')"
        data-cy="log-settings"
      ></VListItem>
    </Acl>
    <VListItem
      v-if="showDevFeature"
      :to="{ name: ROUTE.SYSTEM.BETA }"
      prepend-icon="mdi-beta"
      :title="t('sidebar.settings.beta')"
      data-cy="beta-settings"
    ></VListItem>
    <VListItem class="form-dropdown">
      <VListItemTitle class="text-medium-emphasis text-caption font-weight-light">
        {{ t('system.version') }}: {{ envConfig.appVersion }}
      </VListItemTitle>
    </VListItem>
  </VList>
</template>
