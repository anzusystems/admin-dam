<script lang="ts" setup>
import { ROUTE } from '@/router/routes'
</script>

<template>
  <div class="d-flex justify-center align-center fill-height">
    <div class="flex-grow-1 text-center">
      <h1 class="d-flex justify-center align-center text-primary">
        <VIcon size="x-large" icon="mdi-emoticon-cry" />
        <span>Ups, 401</span>
      </h1>

      <p class="pa-2">Na túto stránku nemáte prístup</p>

      <VBtn :to="{ name: ROUTE.SYSTEM.LOGIN }" color="primary" outlined>Vráť ma na prihlásenie</VBtn>
    </div>
  </div>
</template>
