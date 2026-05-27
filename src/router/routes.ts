import type { Immutable } from '@anzusystems/common-admin'
import { objectDeepFreeze } from '@anzusystems/common-admin'

const routes = {
  DEFAULT: 'asset_list',
  DAM: {
    ASSET: {
      LIST: 'asset_list',
      DETAIL: 'asset_detail',
      FILE_DETAIL: 'asset_fileDetail',
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
    VIDEO_SHOW: {
      LIST: 'videoShow_list',
      DETAIL: 'videoShow_detail',
      EDIT: 'videoShow_edit',
    },
    VIDEO_SHOW_EPISODE: {
      DETAIL: 'videoShowEpisode_detail',
      EDIT: 'videoShowEpisode_edit',
    },
  },
}

export const ROUTE: Immutable<typeof routes> = objectDeepFreeze(routes)
