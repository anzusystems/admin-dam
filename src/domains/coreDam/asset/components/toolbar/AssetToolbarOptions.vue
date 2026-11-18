<script lang="ts" setup>
import { isEmptyObject, isUndefined, useDamConfigState } from '@anzusystems/common-admin'
import type { DamCurrentUserDto } from '@anzusystems/common-admin'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import AssetCreateButton from '@/domains/coreDam/asset/components/AssetCreateButton.vue'
import { useCurrentAssetLicence, useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { ACL, useAuth } from '@/domains/system/auth/auth'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_DAM } from '@/shared/systems'

withDefaults(
  defineProps<{
    variant?: 'main' | 'settings'
    dataCy?: string
  }>(),
  {
    variant: 'main',
    dataCy: undefined,
  }
)

const { t } = useI18n()

const { currentExtSystemId } = useCurrentExtSystem()
const { uploadAllowed } = useCurrentAssetLicence()

const { getDamConfigExtSystem } = useDamConfigState(damClient)
const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
if (isUndefined(configExtSystem)) {
  throw new Error('Ext system must be initialised.')
}

const externalProviders = computed(() => configExtSystem.assetExternalProviders ?? {})

const { useCurrentUser, can } = useAuth()
const { currentUser, isSuperAdmin } = useCurrentUser<DamCurrentUserDto>(SYSTEM_DAM)

// A super admin may open any provider. Others only the ones on their account
// (`AssetExternalProviderVoter`), and only with the access grant the provider list requires.
const offeredExternalProviders = computed(() => {
  if (isSuperAdmin.value) return externalProviders.value
  if (!can(ACL.DAM_ASSET_EXTERNAL_PROVIDER_ACCESS)) return {}
  return Object.fromEntries(
    Object.entries(externalProviders.value).filter(
      ([provider]) => currentUser.value?.allowedAssetExternalProviders.includes(provider) ?? false
    )
  )
})
</script>

<template>
  <VBtn
    :aria-label="t('system.mainBar.options')"
    variant="text"
    icon
    size="small"
    class="mx-1"
    data-cy="button-main"
  >
    <VIcon icon="mdi-view-grid-plus-outline" />
    <VMenu activator="parent">
      <VCard min-width="300">
        <VList>
          <Acl :permission="ACL.DAM_ASSET_CREATE">
            <AssetCreateButton v-if="uploadAllowed" />
          </Acl>
          <VDivider />
          <Acl :permission="ACL.DAM_PODCAST_UI">
            <VListItem
              :to="{ name: '/(coreDam)/podcasts' }"
              :title="t('system.mainBar.podcasts')"
              prepend-icon="mdi-podcast"
              data-cy="button-main-podcast"
            />
          </Acl>
          <Acl :permission="ACL.DAM_VIDEO_SHOW_UI">
            <VListItem
              :to="{ name: '/(coreDam)/video-shows' }"
              :title="t('system.mainBar.videoShows')"
              prepend-icon="mdi-video"
              data-cy="button-main-video-show"
            />
          </Acl>
          <template v-if="!isEmptyObject(offeredExternalProviders)">
            <VDivider />
            <VListItem
              v-for="(provider, key) in offeredExternalProviders"
              :key="key"
              :to="{ name: '/(coreDam)/external-providers/[provider]', params: { provider: key } }"
              :title="provider.title"
              prepend-icon="mdi-puzzle-outline"
            />
          </template>
          <VDivider />
          <VListItem
            v-show="variant === 'main'"
            to="/settings"
            :title="t('system.currentUser.settings')"
            prepend-icon="mdi-cog"
            data-cy="button-settings"
          />
          <VListItem
            v-show="variant === 'settings'"
            prepend-icon="mdi-home"
            :to="{ name: '/(coreDam)/assets' }"
            :title="t('system.currentUser.backToAssets')"
          />
        </VList>
      </VCard>
    </VMenu>
    <VTooltip
      activator="parent"
      location="bottom"
    >
      {{ t('system.mainBar.options') }}
    </VTooltip>
  </VBtn>
</template>
