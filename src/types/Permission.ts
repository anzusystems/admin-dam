import type { Immutable } from '@/types/Immutable'
import { deepFreeze } from '@/utils/object'

const acls = {
  DAM_ASSET_CREATE: 'dam_asset_create',
  DAM_ASSET_UPDATE: 'dam_asset_update',
  DAM_ASSET_VIEW: 'dam_asset_view',
  DAM_ASSET_DELETE: 'dam_asset_delete',
  DAM_VIDEO_CREATE: 'dam_video_create',
  DAM_VIDEO_UPDATE: 'dam_video_update',
  DAM_VIDEO_VIEW: 'dam_video_view',
  DAM_VIDEO_DELETE: 'dam_video_delete',
  DAM_AUDIO_CREATE: 'dam_audio_create',
  DAM_AUDIO_UPDATE: 'dam_audio_update',
  DAM_AUDIO_VIEW: 'dam_audio_view',
  DAM_AUDIO_DELETE: 'dam_audio_delete',
  DAM_CUSTOM_FORM_CREATE: 'dam_customForm_create',
  DAM_CUSTOM_FORM_UPDATE: 'dam_customForm_update',
  DAM_CUSTOM_FORM_VIEW: 'dam_customForm_view',
  DAM_CUSTOM_FORM_ELEMENT_VIEW: 'dam_customFormElement_view',
  DAM_DOCUMENT_CREATE: 'dam_document_create',
  DAM_DOCUMENT_UPDATE: 'dam_document_update',
  DAM_DOCUMENT_VIEW: 'dam_document_view',
  DAM_DOCUMENT_DELETE: 'dam_document_delete',
  DAM_IMAGE_CREATE: 'dam_image_create',
  DAM_IMAGE_UPDATE: 'dam_image_update',
  DAM_IMAGE_VIEW: 'dam_image_view',
  DAM_IMAGE_DELETE: 'dam_image_delete',
  DAM_REGION_OF_INTEREST_CREATE: 'dam_regionOfInterest_create',
  DAM_REGION_OF_INTEREST_UPDATE: 'dam_regionOfInterest_update',
  DAM_REGION_OF_INTEREST_VIEW: 'dam_regionOfInterest_view',
  DAM_REGION_OF_INTEREST_DELETE: 'dam_regionOfInterest_delete',
  DAM_EXT_SYSTEM_UPDATE: 'dam_extSystem_update',
  DAM_EXT_SYSTEM_VIEW: 'dam_extSystem_view',
  DAM_EXT_SYSTEM_LIST: 'dam_extSystem_list',
  DAM_ASSET_LICENCE_CREATE: 'dam_assetLicence_create',
  DAM_ASSET_LICENCE_UPDATE: 'dam_assetLicence_update',
  DAM_ASSET_LICENCE_VIEW: 'dam_assetLicence_view',
  DAM_ASSET_LICENCE_LIST: 'dam_assetLicence_list',
  DAM_USER_VIEW: 'dam_user_view',
  DAM_USER_CREATE: 'dam_user_create',
  DAM_USER_UPDATE: 'dam_user_update',
  DAM_PERMISSION_GROUP_VIEW: 'dam_permissionGroup_view',
  DAM_PERMISSION_GROUP_CREATE: 'dam_permissionGroup_create',
  DAM_PERMISSION_GROUP_UPDATE: 'dam_permissionGroup_update',
  DAM_PERMISSION_GROUP_DELETE: 'dam_permissionGroup_delete',
  DAM_AUTHOR_VIEW: 'dam_author_view',
  DAM_AUTHOR_CREATE: 'dam_author_create',
  DAM_AUTHOR_UPDATE: 'dam_author_update',
  DAM_AUTHOR_DELETE: 'dam_author_delete',
  DAM_KEYWORD_VIEW: 'dam_keyword_view',
  DAM_KEYWORD_CREATE: 'dam_keyword_create',
  DAM_KEYWORD_UPDATE: 'dam_keyword_update',
  DAM_KEYWORD_DELETE: 'dam_keyword_delete',
  DAM_DISTRIBUTION_CATEGORY_VIEW: 'dam_distributionCategory_view',
  DAM_DISTRIBUTION_CATEGORY_CREATE: 'dam_distributionCategory_create',
  DAM_DISTRIBUTION_CATEGORY_UPDATE: 'dam_distributionCategory_update',
  DAM_DISTRIBUTION_CATEGORY_DELETE: 'dam_distributionCategory_delete',
  DAM_DISTRIBUTION_CATEGORY_SELECT_VIEW: 'dam_distributionCategorySelect_view',
  DAM_DISTRIBUTION_CATEGORY_SELECT_UPDATE: 'dam_distributionCategorySelect_update',
  DAM_ASSET_EXTERNAL_PROVIDER_ACCESS: 'dam_assetExternalProvider_access',
  DAM_DISTRIBUTION_ACCESS: 'dam_distribution_access',
  DAM_USER_UI: 'dam_user_ui',
  DAM_PERMISSION_GROUP_UI: 'dam_permissionGroup_ui',
  DAM_EXT_SYSTEM_UI: 'dam_extSystem_ui',
  DAM_ASSET_LICENCE_UI: 'dam_assetLicence_ui',
  DAM_AUTHOR_UI: 'dam_author_ui',
  DAM_KEYWORD_UI: 'dam_keyword_ui',
  DAM_DISTRIBUTION_CATEGORY_UI: 'dam_distributionCategory_ui',
  DAM_DISTRIBUTION_CATEGORY_SELECT_UI: 'dam_distributionCategorySelect_ui',
  ADMIN_LOG_UI: 'admin_log_ui',
} as const

export const ACL: Immutable<typeof acls> = deepFreeze(acls)

type AclKey = keyof typeof ACL
export type AclValue = typeof ACL[AclKey]

export enum Grant {
  NotSet = -1,
  Deny = 0,
  AllowOwner = 1,
  Allow = 2,
}

export type Permissions = {
  [key in AclValue]?: Grant
}

export interface DescribedPermission {
  name: AclValue
  searchIndex: string
  category: PermissionCategory
  categoryTitle: string
  categoryAndGroup: string
  groupTitle: string
  subject: string
  subjectTitle: string
  action: string
  actionTitle: string
  grants: Grant[]
}

export interface PermissionDetail {
  grants: Grant[]
  ui: {
    category: PermissionCategory
    group: string
  }
}

export type PermissionDetails = {
  [key in AclValue]: PermissionDetail
}

export enum PermissionCategory {
  All = 'all',
  Dam = 'dam',
  AdminDam = 'adminDam',
}

export interface PermissionFilter {
  text: string
  category: PermissionCategory
}

export const ALL_ADMIN_PERMISSION_CATEGORIES = [PermissionCategory.AdminDam]
