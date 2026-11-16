<script lang="ts" setup>
import type { DamAuthor } from '@anzusystems/common-admin'
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

const { t } = useI18n()
const { showRecordWas, showWarning } = useAlerts()

const afterCreate = (author: DamAuthor) => {
  if (author.currentAuthors.length > 0) {
    showWarning(t('coreDam.author.isMerged', { name: author.name }))
    return
  }
  if (author.flags.source !== props.source) {
    showWarning(t(section.value.otherKindExists, { name: author.name }))
    return
  }
  showRecordWas('created')
  datatable.value?.refresh()
}

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
