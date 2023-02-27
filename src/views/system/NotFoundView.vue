<script lang="ts" setup>
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="d-flex justify-center align-center fill-height">
    <div class="flex-grow-1 text-center">
      <h1 class="d-flex justify-center align-center text-primary">
        <VIcon size="x-large" icon="mdi-emoticon-cry" />
        <span>{{ t('system.notFoundPage.title') }}</span>
      </h1>

      <p class="pa-2">{{ t('system.notFoundPage.subTitle') }}</p>

      <VBtn :to="{ name: ROUTE.SYSTEM.HOMEPAGE }" color="primary" outlined>{{ t('system.notFoundPage.return') }}</VBtn>
    </div>
  </div>
</template>
