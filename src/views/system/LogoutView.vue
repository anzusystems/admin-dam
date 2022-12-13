<script lang="ts" setup>
import { onMounted } from 'vue'
import { envConfig } from '@/services/EnvConfigService'

onMounted(() => {
  window.location.href = envConfig.logoutCoreDamUrl
})
</script>

<template>
  <div></div>
</template>
