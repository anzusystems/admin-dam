import { messagesSk } from '@anzusystems/common-admin'

import auth from '@/locales/sk/auth.json'
import breadcrumb from '@/locales/sk/breadcrumb.json'
import asset from '@/locales/sk/coreDam/asset.json'
import assetLicence from '@/locales/sk/coreDam/assetLicence.json'
import assetLicenceGroup from '@/locales/sk/coreDam/assetLicenceGroup.json'
import audioFile from '@/locales/sk/coreDam/audioFile.json'
import author from '@/locales/sk/coreDam/author.json'
import authorCleanPhrase from '@/locales/sk/coreDam/authorCleanPhrase.json'
import customDistribution from '@/locales/sk/coreDam/customDistribution.json'
import distribution from '@/locales/sk/coreDam/distribution.json'
import distributionCategory from '@/locales/sk/coreDam/distributionCategory.json'
import distributionCategorySelect from '@/locales/sk/coreDam/distributionCategorySelect.json'
import extSystem from '@/locales/sk/coreDam/extSystem.json'
import job from '@/locales/sk/coreDam/job.json'
import jwDistribution from '@/locales/sk/coreDam/jwDistribution.json'
import keyword from '@/locales/sk/coreDam/keyword.json'
import podcast from '@/locales/sk/coreDam/podcast.json'
import podcastEpisode from '@/locales/sk/coreDam/podcastEpisode.json'
import podcastExportData from '@/locales/sk/coreDam/podcastExportData.json'
import publicExport from '@/locales/sk/coreDam/publicExport.json'
import ttsNarrationRequest from '@/locales/sk/coreDam/ttsNarrationRequest.json'
import user from '@/locales/sk/coreDam/user.json'
import videoFile from '@/locales/sk/coreDam/videoFile.json'
import videoShow from '@/locales/sk/coreDam/videoShow.json'
import videoShowEpisode from '@/locales/sk/coreDam/videoShowEpisode.json'
import voice from '@/locales/sk/coreDam/voice.json'
import voiceFamily from '@/locales/sk/coreDam/voiceFamily.json'
import youtubeDistribution from '@/locales/sk/coreDam/youtubeDistribution.json'
import apiForbiddenOperation from '@/locales/sk/error/apiForbiddenOperation.json'
import apiValidation from '@/locales/sk/error/apiValidation.json'
import jsValidation from '@/locales/sk/error/jsValidation.json'
import sidebar from '@/locales/sk/sidebar.json'
import system from '@/locales/sk/system.json'

export default {
  common: messagesSk.common,
  $vuetify: messagesSk.$vuetify,
  coreDam: {
    asset,
    assetLicence,
    assetLicenceGroup,
    author,
    distribution,
    distributionCategory,
    distributionCategorySelect,
    jwDistribution,
    youtubeDistribution,
    customDistribution,
    extSystem,
    job,
    keyword,
    podcast,
    podcastEpisode,
    podcastExportData,
    user,
    videoShow,
    videoShowEpisode,
    audioFile,
    videoFile,
    authorCleanPhrase,
    publicExport,
    voiceFamily,
    voice,
    ttsNarrationRequest,
  },
  auth,
  sidebar,
  breadcrumb,
  system,
  error: {
    // Spread first so namespaces this admin never overrides still arrive — the
    // package's own alerts.ts calls error.apiTimedOut.message, for one.
    ...messagesSk.error,
    apiValidation: {
      ...messagesSk.error.apiValidation,
      ...apiValidation,
    },
    apiForbiddenOperation: {
      ...messagesSk.error.apiForbiddenOperation,
      ...apiForbiddenOperation,
    },
    jsValidation: {
      ...messagesSk.error.jsValidation,
      ...jsValidation,
    },
  },
}
