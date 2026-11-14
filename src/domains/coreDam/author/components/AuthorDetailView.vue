<script lang="ts" setup>
import { AActionCloseButton, AActionEditButton, ACard, useI18n } from '@anzusystems/common-admin'
import { useAuthorDetailActions } from '@/domains/coreDam/author/composables/authorActions'
import AuthorDetail from '@/domains/coreDam/author/components/AuthorDetail.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { getAuthorSection } from '@/domains/coreDam/author/composables/authorSection'

const props = withDefaults(
  defineProps<{
    source?: boolean
  }>(),
  {
    source: false,
  }
)

const section = computed(() => getAuthorSection(props.source))

const { detailLoading, fetchData, resetStore, author } = useAuthorDetailActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t(section.value.breadcrumbList), routeName: section.value.routeList },
    {
      title: author.value.name || t(section.value.breadcrumbDetail),
      routeName: section.value.routeDetail,
    },
  ])
)

const route = useRoute()
const id = (route.params as { id: string }).id.toString()

const getDetail = () => {
  fetchData(id)
}

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl :permission="section.aclUpdate">
        <AActionEditButton
          v-if="!detailLoading"
          :record-id="id"
          :route-name="section.routeEdit"
        />
      </Acl>
      <AActionCloseButton :route-name="section.routeList" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AuthorDetail />
    </VCardText>
  </ACard>
</template>
