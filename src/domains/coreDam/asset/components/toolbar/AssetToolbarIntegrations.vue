<script lang="ts" setup>
import { isEmptyObject, isUndefined, useDamConfigState } from '@anzusystems/common-admin'
import type { DamCurrentUserDto } from '@anzusystems/common-admin'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { ACL, useAuth } from '@/domains/system/auth/auth'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_DAM } from '@/shared/systems'

const { t } = useI18n()

const router = useRouter()
const route = useRoute()

const backToDam = () => {
  router.push({ name: '/(coreDam)/assets' })
}

const goToExternalProvider = (provider: string) => {
  router.push({ name: '/(coreDam)/external-providers/[provider]', params: { provider } })
}

const { getDamConfigExtSystem } = useDamConfigState(damClient)
const { currentExtSystemId } = useCurrentExtSystem()
const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
if (isUndefined(configExtSystem)) {
  throw new Error('Ext system must be initialised.')
}

const externalProviders = computed(() => {
  return configExtSystem.assetExternalProviders ?? {}
})

const { useCurrentUser, can } = useAuth()
const { currentUser, isSuperAdmin } = useCurrentUser<DamCurrentUserDto>(SYSTEM_DAM)

// A super admin may open any provider, anyone else the ones on their account (`AssetExternalProviderVoter`), and
// only with the access grant the provider's list asks for.
const offeredExternalProviders = computed(() => {
  if (isSuperAdmin.value) return externalProviders.value
  if (!can(ACL.DAM_ASSET_EXTERNAL_PROVIDER_ACCESS)) return {}
  return Object.fromEntries(
    Object.entries(externalProviders.value).filter(
      ([provider]) => currentUser.value?.allowedAssetExternalProviders.includes(provider) ?? false
    )
  )
})

const show = computed(() => {
  return !isEmptyObject(offeredExternalProviders.value)
})

const activeDisplayText = computed(() => {
  const providerParam = (route.params as { provider?: string }).provider as undefined | string
  const matchedProvider = providerParam ? externalProviders.value[providerParam] : undefined
  if (route.name === '/(coreDam)/external-providers/[provider]' && matchedProvider) {
    return matchedProvider.title
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
        v-for="(value, key) in offeredExternalProviders"
        :key="key"
        :title="value.title"
        @click.stop="goToExternalProvider(key)"
      />
    </VList>
  </VMenu>
</template>
