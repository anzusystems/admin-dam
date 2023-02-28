import auth from '@/locales/en/auth.json'
import sidebar from '@/locales/en/sidebar.json'
import system from '@/locales/en/system.json'
import asset from '@/locales/en/coreDam/asset.json'
import assetLicence from '@/locales/en/coreDam/assetLicence.json'
import author from '@/locales/en/coreDam/author.json'
import distribution from '@/locales/en/coreDam/distribution.json'
import distributionCategory from '@/locales/en/coreDam/distributionCategory.json'
import distributionCategorySelect from '@/locales/en/coreDam/distributionCategorySelect.json'
import distributionJw from '@/locales/en/coreDam/distributionJw.json'
import distributionYoutube from '@/locales/en/coreDam/distributionYoutube.json'
import extSystem from '@/locales/en/coreDam/extSystem.json'
import job from '@/locales/en/coreDam/job.json'
import keyword from '@/locales/en/coreDam/keyword.json'
import podcast from '@/locales/en/coreDam/podcast.json'
import podcastEpisode from '@/locales/en/coreDam/podcastEpisode.json'
import user from '@/locales/en/coreDam/user.json'
import videoShow from '@/locales/en/coreDam/videoShow.json'
import videoShowEpisode from '@/locales/en/coreDam/videoShowEpisode.json'
import localValidationJs from '@/locales/en/validation/js.json'
import localValidationApi from '@/locales/en/validation/api.json'
import { messagesEn } from '@anzusystems/common-admin'

export default {
  ...messagesEn,
  coreDam: {
    asset,
    assetLicence,
    author,
    distribution,
    distributionCategory,
    distributionCategorySelect,
    distributionJw,
    distributionYoutube,
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
  system,
  ...{
    validations: {
      api: {
        ...messagesEn.validations.api,
        ...localValidationApi,
      },
      js: {
        ...messagesEn.validations.js,
        ...localValidationJs,
      },
    },
  },
}
