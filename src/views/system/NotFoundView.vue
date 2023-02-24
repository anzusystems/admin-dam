<script lang="ts" setup>
import { ROUTE } from '@/router/routes'
</script>

<template>
  <div class="d-flex justify-center align-center fill-height">
    <div class="flex-grow-1 text-center">
      <h1 class="d-flex justify-center align-center text-primary">
        <VIcon size="x-large" icon="mdi-emoticon-cry" />
        <span>Ops, 404</span>
      </h1>

      <p class="pa-2">This site doesn't exist</p>

      <VBtn :to="{ name: ROUTE.SYSTEM.HOMEPAGE }" color="primary" outlined>Return me to homepage</VBtn>
    </div>
  </div>
</template>
