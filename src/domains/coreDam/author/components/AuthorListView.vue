<script lang="ts" setup>
import { ACard, useI18n } from '@anzusystems/common-admin'
import AuthorDatatable from '@/domains/coreDam/author/components/AuthorDatatable.vue'
import AuthorCreateButton from '@/domains/coreDam/author/components/AuthorCreateButton.vue'
import type AssetLicenceDatatable from '@/domains/coreDam/assetLicence/components/AssetLicenceDatatable.vue'
import { useAuthorListActions } from '@/domains/coreDam/author/composables/authorActions'
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

const { listLoading } = useAuthorListActions()

const datatable = ref<InstanceType<typeof AssetLicenceDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [{ title: t(section.value.breadcrumbList), routeName: section.value.routeList }])
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl :permission="section.aclCreate">
        <AuthorCreateButton
          data-cy="button-create"
          :source="source"
          :button-t="source ? 'coreDam.source.button.create' : undefined"
          disable-redirect
          @on-success="afterCreate"
        />
      </Acl>
    </template>
  </ActionbarWrapper>

  <ACard :loading="listLoading">
    <VCardText>
      <AuthorDatatable
        ref="datatable"
        :source="source"
      />
    </VCardText>
  </ACard>
</template>
