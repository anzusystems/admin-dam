<script lang="ts" setup>
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import AssetCreateButton from '@/views/dam/asset/components/AssetCreateButton.vue'

withDefaults(
  defineProps<{
    variant?: 'main' | 'settings'
  }>(),
  {
    variant: 'main',
  }
)

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <VBtn variant="text" icon size="small" class="mx-1">
    <VIcon icon="mdi-cog" />
    <VMenu activator="parent">
      <VCard min-width="300">
        <VList>
          <AssetCreateButton />
          <VListItem
            :to="{ name: ROUTE.DAM.PODCAST.LIST }"
            :title="t('system.mainBar.podcasts')"
            prepend-icon="mdi-podcast"
          />
          <VDivider></VDivider>
          <VListItem
            :to="{ name: ROUTE.SYSTEM.SETTINGS }"
            :title="t('system.currentUser.settings')"
            prepend-icon="mdi-cog"
            v-show="variant === 'main'"
            data-cy="button-settings"
          />
          <VListItem
            prepend-icon="mdi-home"
            :to="{ name: ROUTE.DAM.ASSET.LIST }"
            :title="t('system.currentUser.backToAssets')"
            v-show="variant === 'settings'"
          ></VListItem>
        </VList>
      </VCard>
    </VMenu>
    <VTooltip activator="parent" location="bottom">{{ t('system.mainBar.options') }}</VTooltip>
  </VBtn>
</template>
