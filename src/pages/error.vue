<script setup lang="ts">
import { AGenericView, isDefined } from '@anzusystems/common-admin'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAppInitialize } from '@/domains/system/composables/appInitialize'

definePage({
  meta: {
    requiresAuth: false,
    requiredPermissions: [],
    layout: 'AppLayoutFullscreen',
  },
})

const { t } = useI18n()
const { accessDeniedExtSystemId } = useAppInitialize()

const title = computed(() =>
  isDefined(accessDeniedExtSystemId.value) ? t('system.errorPage.accessDenied.title') : t('system.errorPage.title')
)
const text = computed(() =>
  isDefined(accessDeniedExtSystemId.value)
    ? t('system.errorPage.accessDenied.subTitle', { extSystem: accessDeniedExtSystemId.value })
    : t('system.errorPage.subTitle')
)

// A full load, not a router push: the start-up leaves module state behind - a half-filled config
// store, a login status that nothing clears - and only a fresh document is a clean retry.
const reload = () => {
  window.location.href = '/'
}
</script>

<template>
  <AGenericView
    :title="title"
    :text="text"
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
