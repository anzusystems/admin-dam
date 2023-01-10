<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import { computed } from 'vue'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()

const backToDam = () => {
  router.push({ name: ROUTE.DAM.ASSET.LIST })
}
const goToExternalProvider = (provider: string) => {
  router.push({ name: ROUTE.DAM.EXTERNAL_PROVIDER.LIST, params: { provider } })
}

const externalProviders = computed(() => {
  return damConfigExtSystem.assetExternalProviders
})
</script>

<template>
  <VBtn variant="text" icon size="small" class="mx-1">
    <VIcon icon="mdi-widgets" />
    <VMenu activator="parent">
      <VCard min-width="300">
        <VList>
          <VListItem :to="{ name: ROUTE.DAM.PODCAST.LIST }" :title="t('system.mainBar.podcasts')" />
        </VList>
        <VList>
          <VDivider></VDivider>
          <VListItem>
            <strong>{{ t('system.mainBar.customIntegrations') }}:</strong>
          </VListItem>
          <VListItem title="DAM" @click="backToDam" />
          <VListItem
            @click="goToExternalProvider(key)"
            v-for="(value, key) in externalProviders"
            :key="key"
            :title="value.title"
          />
        </VList>
      </VCard>
    </VMenu>
    <VTooltip activator="parent" location="bottom">{{ t('system.mainBar.widgets') }}</VTooltip>
  </VBtn>
</template>
