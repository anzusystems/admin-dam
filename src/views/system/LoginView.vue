<script lang="ts" setup>
import { envConfig } from '@/services/EnvConfigService'
import LoginFormSimple from '@/views/system/components/LoginFormSimple.vue'
import LoginFormSso from '@/views/system/components/LoginFormSso.vue'
import { useDamConfigStore, UserAuthType } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'

const damConfigStore = useDamConfigStore()

const userAuthType = damConfigStore.damPubConfig.userAuthType

const { t } = useI18n()
</script>

<template>
  <div class="d-flex justify-center align-center h-100">
    <div class="flex-grow-1 text-center login-wrapper">
      <LoginFormSimple v-if="userAuthType === UserAuthType.JsonCredentials" />
      <LoginFormSso v-else />
    </div>
  </div>
  <div class="full-screen-page-footer px-10">
    <div class="text-medium-emphasis text-caption font-weight-light text-center">
      {{ t('common.system.version') }}: {{ envConfig.appVersion }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.full-screen-page-footer {
  bottom: 0;
  left: 0;
  position: absolute;
  width: 100%;
}
</style>
