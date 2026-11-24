<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionEditButton,
  ACard,
  defineBreadcrumbs,
  useRecordPage,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import AuthorDetail from '@/domains/coreDam/author/components/AuthorDetail.vue'
import { useAuthorDetailActions } from '@/domains/coreDam/author/composables/authorActions'
import { getAuthorSection, getAuthorSectionOfRoute } from '@/domains/coreDam/author/composables/authorSection'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const { detailLoading, fetchData, resetStore, author } = useAuthorDetailActions()

const route = useRoute()
const id = (route.params as { id: string }).id.toString()

const routeSection = getAuthorSectionOfRoute(route.name)
// Once loaded, the record's kind decides, also for a source opened under /authors.
const section = computed(() => (author.value.id ? getAuthorSection(author.value.flags.source) : routeSection))

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(() => [
  { title: t(section.value.breadcrumbList), routeName: section.value.routeList },
  {
    title: author.value.name || t(section.value.breadcrumbDetail),
    routeName: section.value.routeDetail,
  },
])

// The record has these views in both sections. Its close button skips the same ones.
useRecordPage({
  fallbackRouteName: routeSection.routeList,
  skipRouteNames: [
    '/(coreDam)/authors/[id]',
    '/(coreDam)/authors/[id]/edit',
    '/(coreDam)/sources/[id]',
    '/(coreDam)/sources/[id]/edit',
  ],
  loading: detailLoading,
  load: (signal) => fetchData(id, { signal }),
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl
        :key="section.aclUpdate"
        :permission="section.aclUpdate"
      >
        <AActionEditButton
          v-if="!detailLoading"
          :record-id="id"
          :route-name="section.routeEdit"
        />
      </Acl>
      <AActionCloseButtonHistory
        :fallback-route-name="section.routeList"
        :skip-route-names="[
          '/(coreDam)/authors/[id]',
          '/(coreDam)/authors/[id]/edit',
          '/(coreDam)/sources/[id]',
          '/(coreDam)/sources/[id]/edit',
        ]"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AuthorDetail />
    </VCardText>
  </ACard>
</template>
