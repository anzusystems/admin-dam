<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'

const router = useRouter()

onMounted(() => {
  router.push({ name: ROUTE.DAM.ASSET.LIST })
})
</script>

<template>
  <div></div>
</template>
