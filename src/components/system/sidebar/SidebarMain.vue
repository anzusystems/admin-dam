<script lang="ts" setup>
import { ACL } from '@/composables/auth/auth'

const { t } = useI18n()
</script>

<template>
  <VList density="compact" nav color="primary">
    <VListItem
      :to="{ name: '/(coreDam)/asset' }"
      prepend-icon="mdi-home"
      :title="t('sidebar.settings.backToAssets')"
      data-cy="back-to-assets-settings"
    />
    <VDivider />
    <VListItem
      to="/settings"
      prepend-icon="mdi-cog"
      :title="t('sidebar.settings.settings')"
      data-cy="personal-settings"
    />
    <Acl :permission="ACL.DAM_PODCAST_UI">
      <VListItem
        :to="{ name: '/(coreDam)/podcast' }"
        prepend-icon="mdi-podcast"
        :title="t('sidebar.settings.podcasts')"
        data-cy="podcast-settings"
      />
    </Acl>
    <Acl :permission="ACL.DAM_VIDEO_SHOW_UI">
      <VListItem
        :to="{ name: '/(coreDam)/video-show' }"
        prepend-icon="mdi-video-box"
        :title="t('sidebar.settings.videoShows')"
        data-cy="video-show-settings"
      />
    </Acl>
    <Acl :permission="ACL.DAM_USER_UI">
      <VListItem
        :to="{ name: '/(coreDam)/user' }"
        prepend-icon="mdi-account-multiple"
        :title="t('sidebar.settings.users')"
        data-cy="user-settings"
      />
    </Acl>
    <Acl :permission="ACL.DAM_EXT_SYSTEM_UI">
      <VListItem
        :to="{ name: '/(coreDam)/ext-system' }"
        prepend-icon="mdi-television-stop"
        :title="t('sidebar.settings.extSystems')"
        data-cy="ext-system-settings"
      />
    </Acl>
    <Acl :permission="ACL.DAM_ASSET_LICENCE_UI">
      <VListItem
        :to="{ name: '/(coreDam)/asset-licence' }"
        prepend-icon="mdi-account-key"
        :title="t('sidebar.settings.assetLicences')"
        data-cy="asset-licence-settings"
      />
    </Acl>
    <Acl :permission="ACL.DAM_ASSET_LICENCE_GROUP_UI">
      <VListItem
        :to="{ name: '/(coreDam)/asset-licence-group' }"
        prepend-icon="mdi-account-key"
        :title="t('sidebar.settings.assetLicenceGroups')"
        data-cy="asset-licence-group-settings"
      />
    </Acl>
    <Acl :permission="ACL.DAM_AUTHOR_UI">
      <VListItem
        :to="{ name: '/(coreDam)/author' }"
        prepend-icon="mdi-account-circle-outline"
        :title="t('sidebar.settings.authors')"
        data-cy="author-settings"
      />
    </Acl>
    <Acl :permission="ACL.DAM_KEYWORD_UI">
      <VListItem
        :to="{ name: '/(coreDam)/keyword' }"
        prepend-icon="mdi-file-key-outline"
        :title="t('sidebar.settings.keywords')"
        data-cy="keyword-settings"
      />
    </Acl>
    <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_UI">
      <VListItem
        :to="{ name: '/(coreDam)/distribution-category' }"
        prepend-icon="mdi-folder-edit"
        :title="t('sidebar.settings.distributionCategory')"
        data-cy="distribution-category-settings"
      />
    </Acl>
    <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_UI">
      <VListItem
        :to="{ name: '/(coreDam)/distribution-category-select' }"
        prepend-icon="mdi-form-dropdown"
        :title="t('sidebar.settings.distributionCategorySelect')"
        data-cy="distribution-category-select-settings"
      />
    </Acl>
    <VDivider />
    <Acl :permission="ACL.DAM_PERMISSION_GROUP_UI">
      <VListItem
        :to="{ name: '/(common)/permission-group' }"
        prepend-icon="mdi-folder-account-outline"
        :title="t('sidebar.settings.permissionGroups')"
        data-cy="permission-group-settings"
      />
    </Acl>
    <Acl :permission="ACL.DAM_USER_UI">
      <VListItem
        :to="{ name: '/(common)/anzu-user' }"
        prepend-icon="mdi-account-edit-outline"
        :title="t('sidebar.settings.anzuUser')"
        data-cy="user-permissions"
      />
    </Acl>
    <Acl :permission="ACL.DAM_JOB_UI">
      <VListItem
        :to="{ name: '/(coreDam)/job' }"
        prepend-icon="mdi-file-cabinet"
        :title="t('sidebar.settings.job')"
        data-cy="job-settings"
      />
    </Acl>
    <Acl :permission="ACL.DAM_AUTHOR_CLEAN_PHRASE_UI">
      <VListItem
        :to="{ name: '/(coreDam)/author-clean-phrase' }"
        prepend-icon="mdi-spray-bottle"
        :title="t('sidebar.settings.authorCleanPhrase')"
        data-cy="job-settings"
      />
    </Acl>
    <Acl :permission="ACL.DAM_PUBLIC_EXPORT_CREATE">
      <VListItem
        :to="{ name: '/(coreDam)/public-export' }"
        prepend-icon="mdi-export"
        :title="t('sidebar.settings.publicExport')"
        data-cy="public-export"
      />
    </Acl>
    <Acl :permission="ACL.DAM_LOG_UI">
      <VListItem
        :to="{ name: '/(common)/log' }"
        prepend-icon="mdi-math-log"
        :title="t('sidebar.settings.log')"
        data-cy="log-settings"
      />
    </Acl>
  </VList>
</template>
