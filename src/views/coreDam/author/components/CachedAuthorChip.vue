<script lang="ts" setup>
import { ROUTE } from '@/router/routes'
import type { IntegerId } from '@anzusystems/common-admin'
import { ACachedChip } from '@anzusystems/common-admin'
import { useCachedAuthors } from '@/views/coreDam/author/composables/cachedAuthors'

const props = withDefaults(
  defineProps<{
    id: null | IntegerId | undefined
    showDescription?: boolean
    textOnly?: boolean
  }>(),
  {
    showDescription: false,
    textOnly: false,
  }
)

const { getCachedAuthor } = useCachedAuthors()

</script>

<template>
  <ACachedChip
    :id="id"
    :get-cached-fn="getCachedAuthor"
    :route="ROUTE.DAM.AUTHOR.DETAIL"
    :text-only="textOnly"
    display-text-path="name"
    wrap-text
  />
</template>
