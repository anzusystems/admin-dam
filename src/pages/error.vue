<script setup lang="ts">
import { AGenericView, isDefined } from '@anzusystems/common-admin'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { useAppInitialize } from '@/domains/system/composables/appInitialize'
import { errorPageReturnPath, openAppPath } from '@/router/errorPage'

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

const route = useRoute()

// A full load, not a router push. Start-up leaves module state behind,
// such as a half-filled config store and a login status nothing clears.
// Only a fresh document gives a clean retry, of the page that failed to open.
const reload = () => {
  openAppPath(errorPageReturnPath(route.query))
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
