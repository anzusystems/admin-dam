<script lang="ts" setup>
import { envConfig } from '@/shared/EnvConfigService'

const { t } = useI18n()
</script>

<template>
  <div class="d-flex justify-center align-center h-100">
    <div class="flex-grow-1 text-center login-wrapper text-headline-medium">
      {{ t('system.closePage.title') }}
    </div>
  </div>
  <div class="full-screen-page-footer px-10">
    <div class="text-medium-emphasis text-body-small font-weight-light text-center">
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
