<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import { isEmptyObject } from '@anzusystems/common-admin'

const { t } = useI18n({ useScope: 'global' })

const router = useRouter()
const route = useRoute()

const backToDam = () => {
  router.push({ name: ROUTE.DAM.ASSET.LIST })
}

const goToExternalProvider = (provider: string) => {
  router.push({ name: ROUTE.DAM.EXTERNAL_PROVIDER.LIST, params: { provider } })
}

const externalProviders = computed(() => {
  return damConfigExtSystem.assetExternalProviders
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
  <VMenu location="bottom" v-if="show">
    <template v-slot:activator="{ props }">
      <VBtn variant="text" size="small" class="mx-1" rounded="pill" :height="34" v-bind="props">
        {{ activeDisplayText }}
        <VIcon icon="mdi-chevron-down" />
        <VTooltip activator="parent" location="bottom">{{ t('system.mainBar.customIntegrations.title') }}</VTooltip>
      </VBtn>
    </template>
    <VList>
      <VListItem :title="t('system.mainBar.customIntegrations.assets')" @click="backToDam" />
      <VListItem
        @click.stop="goToExternalProvider(key)"
        v-for="(value, key) in externalProviders"
        :key="key"
        :title="value.title"
      />
    </VList>
  </VMenu>
</template>
