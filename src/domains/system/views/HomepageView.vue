<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  // In the place of this page in the history: left there, the way back from the list would end here, on a list anew.
  router.replace({ name: '/(coreDam)/assets' })
})
</script>

<template>
  <div />
</template>
