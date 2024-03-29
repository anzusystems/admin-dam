<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import { isEmptyObject, isUndefined, useDamConfigState } from '@anzusystems/common-admin'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { damClient } from '@/services/api/clients/damClient'

const { t } = useI18n()

const router = useRouter()
const route = useRoute()

const backToDam = () => {
  router.push({ name: ROUTE.DAM.ASSET.LIST })
}

const goToExternalProvider = (provider: string) => {
  router.push({ name: ROUTE.DAM.EXTERNAL_PROVIDER.LIST, params: { provider } })
}

const { getDamConfigExtSystem } = useDamConfigState(damClient)
const { currentExtSystemId } = useCurrentExtSystem()
const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
if (isUndefined(configExtSystem)) {
  throw new Error('Ext system must be initialised.')
}

const externalProviders = computed(() => {
  return configExtSystem.assetExternalProviders
})

const show = computed(() => {
  return !isEmptyObject(externalProviders.value)
})

const activeDisplayText = computed(() => {
  const providerParam = route.params.provider as undefined | string
  if (route.name === ROUTE.DAM.EXTERNAL_PROVIDER.LIST && providerParam && externalProviders.value[providerParam]) {
    return externalProviders.value[providerParam].title
  }
  return t('system.mainBar.customIntegrations.assets')
})
</script>

<template>
  <VMenu
    v-if="show"
    location="bottom"
  >
    <template #activator="{ props }">
      <VBtn
        variant="text"
        size="small"
        class="mx-1 pl-2 pr-1 pl-sm-3 pr-sm-2"
        rounded="pill"
        :height="34"
        v-bind="props"
      >
        {{ activeDisplayText }}
        <VIcon icon="mdi-chevron-down" />
        <VTooltip
          activator="parent"
          location="bottom"
        >
          {{ t('system.mainBar.customIntegrations.title') }}
        </VTooltip>
      </VBtn>
    </template>
    <VList>
      <VListItem
        :title="t('system.mainBar.customIntegrations.assets')"
        @click="backToDam"
      />
      <VListItem
        v-for="(value, key) in externalProviders"
        :key="key"
        :title="value.title"
        @click.stop="goToExternalProvider(key)"
      />
    </VList>
  </VMenu>
</template>
