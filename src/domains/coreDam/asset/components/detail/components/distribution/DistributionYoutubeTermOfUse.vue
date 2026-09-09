<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div>
    <div>
      {{ t('coreDam.distribution.youtubeTerms.intro') }}
      <a
        href="https://developers.google.com/youtube/terms/api-services-terms-of-service"
        target="_blank"
        rel="noopener noreferrer"
      >{{ t('coreDam.distribution.youtubeTerms.apiServices') }}</a>
    </div>
    <div>
      <a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noopener noreferrer"
      >{{ t('coreDam.distribution.youtubeTerms.googlePrivacy') }}</a>
    </div>
    <div>
      <a
        href="https://developers.google.com/youtube/terms/developer-policies#a.-api-client-terms-of-use-and-privacy-policies"
        target="_blank"
        rel="noopener noreferrer"
      >{{ t('coreDam.distribution.youtubeTerms.apiClientTerms') }}</a>
    </div>
    <div>
      <a
        href="https://developers.google.com/youtube/terms/api-services-terms-of-service"
        target="_blank"
        rel="noopener noreferrer"
      >{{ t('coreDam.distribution.youtubeTerms.apiServicesTerms') }}</a>
    </div>
    <div>
      <a
        href="https://www.sme.sk/dok/20455056/zasady-nakladania-s-osobnymi-udajmi-uzivatelov"
        target="_blank"
        rel="noopener noreferrer"
      >{{ t('coreDam.distribution.youtubeTerms.privacy') }}</a>
    </div>
    <div>
      <a
        href="https://www.sme.sk/dok/20814016/pravidla-pouzivania-cookies"
        target="_blank"
        rel="noopener noreferrer"
      >{{ t('coreDam.distribution.youtubeTerms.cookies') }}</a>
    </div>
    <div>
      <a
        href="https://www.sme.sk/dok/20367415/vseobecne-obchodne-podmienky-online-predplatneho-sme-sk"
        target="_blank"
        rel="noopener noreferrer"
      >{{ t('coreDam.distribution.youtubeTerms.subscriptionTerms') }}</a>
    </div>
    <div>
      <a
        href="https://www.sme.sk/dok/20804558/vseobecne-obchodne-podmienky-a-pravidla-sluzieb-sme-sk"
        target="_blank"
        rel="noopener noreferrer"
      >{{ t('coreDam.distribution.youtubeTerms.serviceTerms') }}</a>
    </div>
    <div>
      <a
        href="https://www.youtube.com/t/terms"
        target="_blank"
        rel="noopener noreferrer"
      >{{ t('coreDam.distribution.youtubeTerms.serviceProvisionTerms') }}</a>
    </div>
    <div>
      <a
        href="https://www.youtube.com/howyoutubeworks/policies/community-guidelines/"
        target="_blank"
        rel="noopener noreferrer"
      >{{ t('coreDam.distribution.youtubeTerms.communityGuidelines') }}</a>
    </div>
    <div>
      <a
        href="https://www.youtube.com/howyoutubeworks/policies/copyright/"
        target="_blank"
        rel="noopener noreferrer"
      >{{ t('coreDam.distribution.youtubeTerms.copyright') }}</a>
    </div>
  </div>
</template>
