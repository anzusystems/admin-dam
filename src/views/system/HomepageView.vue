<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  router.push({ name: '/(coreDam)/asset' })
})
</script>

<template>
  <div />
</template>
