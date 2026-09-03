<script lang="ts" setup>
import AssetCreateButton from '@/domains/coreDam/asset/components/AssetCreateButton.vue'
import { useCurrentListView } from '@/domains/coreDam/assetListView/composables/currentListView'
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { ACL } from '@/domains/system/auth/auth'
import { damClient } from '@/shared/apiClients/damClient'
import { useDamConfigState } from '@anzusystems/common-admin'

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

const { uploadAllowed } = useCurrentListView()

const { getDamConfigExtSystem } = useDamConfigState(damClient)
const { currentExtSystemId } = useCurrentExtSystem()
const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
if (isUndefined(configExtSystem)) {
  throw new Error('Ext system must be initialised.')
}

const externalProviders = computed(() => configExtSystem.assetExternalProviders ?? {})
</script>

<template>
  <VBtn
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
          <Acl :permission="ACL.DAM_ASSET_EXTERNAL_PROVIDER_ACCESS">
            <template v-if="!isEmptyObject(externalProviders)">
              <VDivider />
              <VListItem
                v-for="(provider, key) in externalProviders"
                :key="key"
                :to="{ name: '/(coreDam)/external-providers/[provider]', params: { provider: key } }"
                :title="provider.title"
                prepend-icon="mdi-puzzle-outline"
              />
            </template>
          </Acl>
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
