import auth from '@/locales/en/auth.json'
import sidebar from '@/locales/en/sidebar.json'
import system from '@/locales/en/system.json'
import asset from '@/locales/en/coreDam/asset.json'
import assetLicence from '@/locales/en/coreDam/assetLicence.json'
import author from '@/locales/en/coreDam/author.json'
import distribution from '@/locales/en/coreDam/distribution.json'
import distributionCategory from '@/locales/en/coreDam/distributionCategory.json'
import distributionCategorySelect from '@/locales/en/coreDam/distributionCategorySelect.json'
import jwDistribution from '@/locales/en/coreDam/jwDistribution.json'
import customDistribution from '@/locales/en/coreDam/customDistribution.json'
import youtubeDistribution from '@/locales/en/coreDam/youtubeDistribution.json'
import extSystem from '@/locales/en/coreDam/extSystem.json'
import job from '@/locales/en/coreDam/job.json'
import keyword from '@/locales/en/coreDam/keyword.json'
import podcast from '@/locales/en/coreDam/podcast.json'
import podcastEpisode from '@/locales/en/coreDam/podcastEpisode.json'
import user from '@/locales/en/coreDam/user.json'
import videoShow from '@/locales/en/coreDam/videoShow.json'
import videoShowEpisode from '@/locales/en/coreDam/videoShowEpisode.json'
import { messagesEn } from '@anzusystems/common-admin'
import apiValidation from '@/locales/en/error/apiValidation.json'
import apiForbiddenOperation from '@/locales/en/error/apiForbiddenOperation.json'
import jsValidation from '@/locales/en/error/jsValidation.json'
import breadcrumb from '@/locales/en/breadcrumb.json'

export default {
  common: messagesEn.common,
  $vuetify: messagesEn.$vuetify,
  coreDam: {
    asset,
    assetLicence,
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
    user,
    videoShow,
    videoShowEpisode,
  },
  auth,
  sidebar,
  breadcrumb,
  system,
  ...{
    error: {
      apiValidation: {
        ...messagesEn.error.apiValidation,
        ...apiValidation,
      },
      apiForbiddenOperation: {
        ...messagesEn.error.apiForbiddenOperation,
        ...apiForbiddenOperation,
      },
      jsValidation: {
        ...messagesEn.error.jsValidation,
        ...jsValidation,
      },
    },
  },
}
