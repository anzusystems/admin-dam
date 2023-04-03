<script lang="ts" setup>
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import { ACL } from '@/types/Permission'

const { t } = useI18n()
</script>

<template>
  <VList
    density="compact"
    nav
    color="primary"
  >
    <VListItem
      :to="{ name: ROUTE.DAM.ASSET.LIST }"
      prepend-icon="mdi-home"
      :title="t('sidebar.settings.backToAssets')"
      data-cy="back-to-assets-settings"
    />
    <VDivider />
    <VListItem
      :to="{ name: ROUTE.SYSTEM.SETTINGS }"
      prepend-icon="mdi-cog"
      :title="t('sidebar.settings.settings')"
      data-cy="personal-settings"
    />
    <Acl :permission="ACL.DAM_PODCAST_UI">
      <VListItem
        :to="{ name: ROUTE.DAM.PODCAST.LIST }"
        prepend-icon="mdi-podcast"
        :title="t('sidebar.settings.podcasts')"
        data-cy="podcast-settings"
      />
    </Acl>
    <Acl :permission="ACL.DAM_VIDEO_SHOW_UI">
      <VListItem
        :to="{ name: ROUTE.DAM.VIDEO_SHOW.LIST }"
        prepend-icon="mdi-video-box"
        :title="t('sidebar.settings.videoShows')"
        data-cy="video-show-settings"
      />
    </Acl>
    <Acl :permission="ACL.DAM_USER_UI">
      <VListItem
        :to="{ name: ROUTE.DAM.USER.LIST }"
        prepend-icon="mdi-account-multiple"
        :title="t('sidebar.settings.users')"
        data-cy="user-settings"
      />
    </Acl>
    <Acl :permission="ACL.DAM_EXT_SYSTEM_UI">
      <VListItem
        :to="{ name: ROUTE.DAM.EXT_SYSTEM.LIST }"
        prepend-icon="mdi-television-stop"
        :title="t('sidebar.settings.extSystems')"
        data-cy="ext-system-settings"
      />
    </Acl>
    <Acl :permission="ACL.DAM_ASSET_LICENCE_UI">
      <VListItem
        :to="{ name: ROUTE.DAM.ASSET_LICENCE.LIST }"
        prepend-icon="mdi-account-key"
        :title="t('sidebar.settings.assetLicences')"
        data-cy="asset-licence-settings"
      />
    </Acl>
    <Acl :permission="ACL.DAM_AUTHOR_UI">
      <VListItem
        :to="{ name: ROUTE.DAM.AUTHOR.LIST }"
        prepend-icon="mdi-account-circle-outline"
        :title="t('sidebar.settings.authors')"
        data-cy="author-settings"
      />
    </Acl>
    <Acl :permission="ACL.DAM_KEYWORD_UI">
      <VListItem
        :to="{ name: ROUTE.DAM.KEYWORD.LIST }"
        prepend-icon="mdi-file-key-outline"
        :title="t('sidebar.settings.keywords')"
        data-cy="keyword-settings"
      />
    </Acl>
    <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_UI">
      <VListItem
        :to="{ name: ROUTE.DAM.DISTRIBUTION_CATEGORY.LIST }"
        prepend-icon="mdi-folder-edit"
        :title="t('sidebar.settings.distributionCategory')"
        data-cy="distribution-category-settings"
      />
    </Acl>
    <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_UI">
      <VListItem
        :to="{ name: ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.LIST }"
        prepend-icon="mdi-form-dropdown"
        :title="t('sidebar.settings.distributionCategorySelect')"
        data-cy="distribution-category-select-settings"
      />
    </Acl>
    <VDivider />
    <Acl :permission="ACL.DAM_PERMISSION_GROUP_UI">
      <VListItem
        :to="{ name: ROUTE.COMMON.PERMISSION_GROUP.LIST }"
        prepend-icon="mdi-folder-account-outline"
        :title="t('sidebar.settings.permissionGroups')"
        data-cy="permission-group-settings"
      />
    </Acl>
    <Acl :permission="ACL.DAM_USER_UI">
      <VListItem
        :to="{ name: ROUTE.COMMON.ANZU_USER.LIST }"
        prepend-icon="mdi-account-edit-outline"
        :title="t('sidebar.settings.anzuUser')"
        data-cy="user-permissions"
      />
    </Acl>
    <Acl :permission="ACL.DAM_JOB_UI">
      <VListItem
        :to="{ name: ROUTE.DAM.JOB.LIST }"
        prepend-icon="mdi-file-cabinet"
        :title="t('sidebar.settings.job')"
        data-cy="job-settings"
      />
    </Acl>
    <Acl :permission="ACL.DAM_LOG_UI">
      <VListItem
        :to="{ name: ROUTE.COMMON.LOG.LIST }"
        prepend-icon="mdi-math-log"
        :title="t('sidebar.settings.log')"
        data-cy="log-settings"
      />
    </Acl>
  </VList>
</template>
