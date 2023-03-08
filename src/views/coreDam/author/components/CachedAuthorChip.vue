<script lang="ts" setup>
import CachedChip from '@/views/coreDam/user/components/CachedChip.vue'
import { ROUTE } from '@/router/routes'
import type { DocId } from '@anzusystems/common-admin'
import { useCachedAuthors } from '@/views/coreDam/author/composables/cachedAuthors'

withDefaults(
  defineProps<{
    id: null | DocId | undefined
    closeIcon?: string
    disableClick?: boolean
    appendIcon?: string | undefined
    forceRounded?: boolean
    textOnly?: boolean
    fallbackIdText?: boolean
    hideLoader?: boolean
  }>(),
  {
    closeIcon: 'close-circle',
    disableClick: false,
    appendIcon: undefined,
    forceRounded: false,
    textOnly: false,
    fallbackIdText: false,
    hideLoader: false,
  }
)

const { getCachedAuthor } = useCachedAuthors()
</script>

<template>
  <CachedChip
    :id="id"
    :close-icon="closeIcon"
    :disable-click="disableClick"
    :get-cached-fn="getCachedAuthor"
    :route="ROUTE.DAM.AUTHOR.DETAIL"
    :append-icon="appendIcon"
    :force-rounded="forceRounded"
    :text-only="textOnly"
    :fallback-id-text="fallbackIdText"
    :hide-loader="hideLoader"
    display-text-path="name"
    closable
  />
</template>
