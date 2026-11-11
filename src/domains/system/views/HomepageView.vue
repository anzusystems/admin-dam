<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  // Replace, not push: otherwise going back from the list would land here and redirect to the list again.
  router.replace({ name: '/(coreDam)/assets' })
})
</script>

<template>
  <div />
</template>
