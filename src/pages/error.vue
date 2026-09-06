<script setup lang="ts">
import { AGenericView } from '@anzusystems/common-admin'

definePage({
  meta: {
    requiresAuth: false,
    requiredPermissions: [],
    layout: 'AppLayoutFullscreen',
  },
})

const { t } = useI18n()

// A full load, not a router push: the start-up leaves module state behind - a half-filled config
// store, a login status that nothing clears - and only a fresh document is a clean retry.
const reload = () => {
  window.location.href = '/'
}
</script>

<template>
  <AGenericView
    :title="t('system.errorPage.title')"
    :text="t('system.errorPage.subTitle')"
    icon="mdi-alert-circle-outline"
  >
    <template #actions>
      <VBtn
        color="primary"
        size="large"
        @click="reload"
      >
        {{ t('system.errorPage.return') }}
      </VBtn>
    </template>
  </AGenericView>
</template>
