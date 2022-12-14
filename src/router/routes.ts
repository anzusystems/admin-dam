import { deepFreeze } from '@/utils/object'
import type { Immutable } from '@/types/Immutable'

const routes = {
  DEFAULT: 'asset_list',
  COMMON: {
    LOG: {
      LIST: 'common_log_list',
      DETAIL: 'common_log_detail',
    },
  },
  DAM: {
    ASSET: {
      LIST: 'asset_list',
    },
    EXTERNAL_PROVIDER: {
      LIST: 'external_provider_list',
    },
    USER: {
      LIST: 'user_list',
      DETAIL: 'user_detail',
      EDIT: 'user_edit',
    },
    EXT_SYSTEM: {
      LIST: 'extSystem_list',
      DETAIL: 'extSystem_detail',
      EDIT: 'extSystem_edit',
    },
    ASSET_LICENCE: {
      LIST: 'assetLicence_list',
      DETAIL: 'assetLicence_detail',
      EDIT: 'assetLicence_edit',
    },
    PERMISSION_GROUP: {
      LIST: 'permissionGroup_list',
      DETAIL: 'permissionGroup_detail',
      EDIT: 'permissionGroup_edit',
    },
    AUTHOR: {
      LIST: 'author_list',
      DETAIL: 'author_detail',
      EDIT: 'author_edit',
    },
    KEYWORD: {
      LIST: 'keyword_list',
      DETAIL: 'keyword_detail',
      EDIT: 'keyword_edit',
    },
    DISTRIBUTION_CATEGORY: {
      LIST: 'distributionCategory_list',
      DETAIL: 'distributionCategory_detail',
      EDIT: 'distributionCategory_edit',
    },
    DISTRIBUTION_CATEGORY_SELECT: {
      LIST: 'distributionCategorySelect_list',
      DETAIL: 'distributionCategorySelect_detail',
      EDIT: 'distributionCategorySelect_edit',
    },
    PODCAST: {
      LIST: 'podcast_list',
      DETAIL: 'podcast_detail',
      EDIT: 'podcast_edit',
    },
    PODCAST_EPISODE: {
      DETAIL: 'podcastEpisode_detail',
      EDIT: 'podcastEpisode_edit',
    },
  },
  SYSTEM: {
    HOMEPAGE: 'homepage',
    UNAUTHORIZED: 'unauthorized',
    LOGIN: 'login',
    LOGOUT: 'logout',
    NOT_FOUND: 'notfound',
    SETTINGS: 'settings',
    BETA: 'beta',
    CLOSE_PAGE: 'close_page',
  },
}

export const ROUTE: Immutable<typeof routes> = deepFreeze(routes)
