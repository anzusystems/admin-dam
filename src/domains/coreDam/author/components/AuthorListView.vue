<script lang="ts" setup>
import { ACard, ADamAuthorCreateButton, defineBreadcrumbs, useAlerts } from '@anzusystems/common-admin'
import type { DamAuthor } from '@anzusystems/common-admin'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import type AssetLicenceDatatable from '@/domains/coreDam/assetLicence/components/AssetLicenceDatatable.vue'
import AuthorDatatable from '@/domains/coreDam/author/components/AuthorDatatable.vue'
import { useAuthorListActions } from '@/domains/coreDam/author/composables/authorActions'
import { getAuthorSection } from '@/domains/coreDam/author/composables/authorSection'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

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
const { currentExtSystemId } = useCurrentExtSystem()

const datatable = ref<InstanceType<typeof AssetLicenceDatatable> | null>(null)

const { t } = useI18n()
const { showRecordWas, showWarning } = useAlerts()

// The create returns the record of that name when it already exists, merged or of the other kind.
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

const breadcrumbs = defineBreadcrumbs(() => [
  { title: t(section.value.breadcrumbList), routeName: section.value.routeList },
])
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl :permission="section.aclCreate">
        <ADamAuthorCreateButton
          :ext-system="currentExtSystemId"
          data-cy="button-create"
          :source="source"
          :button-t="source ? 'coreDam.source.button.create' : undefined"
          :notify-created="false"
          @success="afterCreate"
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
