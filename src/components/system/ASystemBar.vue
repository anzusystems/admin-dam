<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { envConfig } from '@/services/EnvConfigService'
import { isUndefined } from '@/utils/common'
import ASystemBarNewVersion from '@/components/system/ASystemBarNewVersion.vue'

const CHECK_NEW_VERSION_INTERVAL_MS = 60000

const showSystemBar = ref(false)

const checkNewVersion = () => {
  fetch('/config.json?random=' + Date.now())
    .then((res) => {
      if (res.ok) {
        const contentType = res.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Unable to load env config. Incorrect content type.')
        }
        return res.json()
      }
      throw new Error('Unable to load env config. Incorrect response code.')
    })
    .then((config) => {
      if (Object.keys(config).length < 1) {
        throw new Error('Unable to load env config. Incorrect response body.')
      }
      showSystemBar.value = !isUndefined(config.appVersion) && config.appVersion !== envConfig.appVersion
    })
    .catch((err) => {
      console.error(err)
    })
}

const systemBarComponent = computed(() => {
  return ASystemBarNewVersion
})

const { pause } = useIntervalFn(() => {
  checkNewVersion()
}, CHECK_NEW_VERSION_INTERVAL_MS)

onBeforeUnmount(() => {
  pause()
})
</script>

<template>
  <VAppBar v-if="showSystemBar" height="24" color="orange accent-3" elevation="0" :order="-1">
    <div class="text-center w-100 text-caption pb-1">
      <component :is="systemBarComponent" />
    </div>
  </VAppBar>
</template>
