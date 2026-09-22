<script lang="ts" setup>
import { ACL } from '@/domains/system/auth/auth'

const { t } = useI18n()
</script>

<template>
  <VList
    density="compact"
    nav
    color="primary"
  >
    <VListItem
      :to="{ name: '/(coreDam)/assets' }"
      prepend-icon="mdi-home"
    >
      <VTooltip
        location="right"
        activator="parent"
      >
        {{ t('sidebar.settings.backToAssets') }}
      </VTooltip>
    </VListItem>
    <VDivider />
    <VListItem
      to="/settings"
      prepend-icon="mdi-cog"
      data-cy="personal-settings"
    >
      <VTooltip
        location="right"
        activator="parent"
      >
        {{ t('sidebar.settings.settings') }}
      </VTooltip>
    </VListItem>
    <Acl :permission="ACL.DAM_PODCAST_UI">
      <VListItem
        :to="{ name: '/(coreDam)/podcasts' }"
        prepend-icon="mdi-podcast"
        data-cy="podcast-settings"
      >
        <VTooltip
          location="right"
          activator="parent"
        >
          {{ t('sidebar.settings.podcasts') }}
        </VTooltip>
      </VListItem>
    </Acl>
    <Acl :permission="ACL.DAM_VIDEO_SHOW_UI">
      <VListItem
        :to="{ name: '/(coreDam)/video-shows' }"
        prepend-icon="mdi-video-box"
        data-cy="video-show-settings"
      >
        <VTooltip
          location="right"
          activator="parent"
        >
          {{ t('sidebar.settings.videoShows') }}
        </VTooltip>
      </VListItem>
    </Acl>
    <Acl :permission="ACL.DAM_USER_UI">
      <VListItem
        :to="{ name: '/(coreDam)/users' }"
        prepend-icon="mdi-account-multiple"
        data-cy="user-settings"
      >
        <VTooltip
          location="right"
          activator="parent"
        >
          {{ t('sidebar.settings.users') }}
        </VTooltip>
      </VListItem>
    </Acl>
    <Acl :permission="ACL.DAM_EXT_SYSTEM_UI">
      <VListItem
        :to="{ name: '/(coreDam)/ext-systems' }"
        prepend-icon="mdi-television-stop"
        data-cy="ext-system-settings"
      >
        <VTooltip
          location="right"
          activator="parent"
        >
          {{ t('sidebar.settings.extSystems') }}
        </VTooltip>
      </VListItem>
    </Acl>
    <Acl :permission="ACL.DAM_ASSET_LICENCE_UI">
      <VListItem
        :to="{ name: '/(coreDam)/asset-licences' }"
        prepend-icon="mdi-account-key"
        data-cy="asset-licence-settings"
      >
        <VTooltip
          location="right"
          activator="parent"
        >
          {{ t('sidebar.settings.assetLicences') }}
        </VTooltip>
      </VListItem>
    </Acl>
    <Acl :permission="ACL.DAM_ASSET_LICENCE_GROUP_UI">
      <VListItem
        :to="{ name: '/(coreDam)/asset-licence-groups' }"
        prepend-icon="mdi-account-key"
        data-cy="asset-licence-group-settings"
      >
        <VTooltip
          location="right"
          activator="parent"
        >
          {{ t('sidebar.settings.assetLicenceGroups') }}
        </VTooltip>
      </VListItem>
    </Acl>
    <Acl :permission="ACL.DAM_AUTHOR_UI">
      <VListItem
        :to="{ name: '/(coreDam)/authors' }"
        prepend-icon="mdi-account-circle-outline"
        data-cy="author-settings"
      >
        <VTooltip
          location="right"
          activator="parent"
        >
          {{ t('sidebar.settings.authors') }}
        </VTooltip>
      </VListItem>
    </Acl>
    <Acl :permission="ACL.DAM_KEYWORD_UI">
      <VListItem
        :to="{ name: '/(coreDam)/keywords' }"
        prepend-icon="mdi-file-key-outline"
        data-cy="keyword-settings"
      >
        <VTooltip
          location="right"
          activator="parent"
        >
          {{ t('sidebar.settings.keywords') }}
        </VTooltip>
      </VListItem>
    </Acl>
    <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_UI">
      <VListItem
        :to="{ name: '/(coreDam)/distribution-categories' }"
        prepend-icon="mdi-folder-edit"
        data-cy="distribution-category-settings"
      >
        <VTooltip
          location="right"
          activator="parent"
        >
          {{ t('sidebar.settings.distributionCategory') }}
        </VTooltip>
      </VListItem>
    </Acl>
    <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_UI">
      <VListItem
        :to="{ name: '/(coreDam)/distribution-category-selects' }"
        prepend-icon="mdi-form-dropdown"
        data-cy="distribution-category-select-settings"
      >
        <VTooltip
          location="right"
          activator="parent"
        >
          {{ t('sidebar.settings.distributionCategorySelect') }}
        </VTooltip>
      </VListItem>
    </Acl>
    <VDivider />
    <Acl :permission="ACL.DAM_PERMISSION_GROUP_UI">
      <VListItem
        :to="{ name: '/(common)/permission-groups' }"
        prepend-icon="mdi-folder-account-outline"
        data-cy="permission-group-settings"
      >
        <VTooltip
          location="right"
          activator="parent"
        >
          {{ t('sidebar.settings.permissionGroups') }}
        </VTooltip>
      </VListItem>
    </Acl>
    <Acl :permission="ACL.DAM_USER_UI">
      <VListItem
        :to="{ name: '/(common)/anzu-users' }"
        prepend-icon="mdi-account-edit-outline"
        data-cy="user-permissions"
      >
        <VTooltip
          location="right"
          activator="parent"
        >
          {{ t('sidebar.settings.anzuUser') }}
        </VTooltip>
      </VListItem>
    </Acl>
    <Acl :permission="ACL.DAM_JOB_UI">
      <VListItem
        :to="{ name: '/(coreDam)/jobs' }"
        prepend-icon="mdi-file-cabinet"
        data-cy="job-settings"
      >
        <VTooltip
          location="right"
          activator="parent"
        >
          {{ t('sidebar.settings.job') }}
        </VTooltip>
      </VListItem>
    </Acl>
    <Acl :permission="ACL.DAM_LOG_UI">
      <VListItem
        :to="{ name: '/(common)/logs' }"
        prepend-icon="mdi-math-log"
        data-cy="log-settings"
      >
        <VTooltip
          location="right"
          activator="parent"
        >
          {{ t('sidebar.settings.log') }}
        </VTooltip>
      </VListItem>
    </Acl>
  </VList>
</template>
