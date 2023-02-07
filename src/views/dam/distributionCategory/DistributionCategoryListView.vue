<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { useI18n } from 'vue-i18n'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import DistributionCategoryDatatable from '@/views/dam/distributionCategory/components/DistributionCategoryDatatable.vue'
import { useDistributionCategoryListFilter } from '@/model/dam/filter/DistributionCategoryFilter'
import { computed, ref } from 'vue'
import {
  useDistributionCategoryListActions,
  useDistributionCategoryManageActions,
} from '@/views/dam/distributionCategory/composables/distributionCategoryActions'
import DistributionCategoryCreateButton from '@/views/dam/distributionCategory/components/DistributionCategoryCreateButton.vue'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import { ACL } from '@/types/Permission'

const filter = useDistributionCategoryListFilter()
const { getAvailableDistributionServiceSlugs } = useDistributionCategoryManageActions()
const { listLoading } = useDistributionCategoryListActions()

const assetType = computed(() => filter.type.model as AssetType)

const { t } = useI18n({ useScope: 'global' })

const datatable = ref<InstanceType<typeof DistributionCategoryDatatable> | null>(null)

const onCreateSuccess = (type: AssetType) => {
  filter.type.model = type
  datatable.value?.refresh()
}
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.distributionCategory.meta.list')" icon="mdi-folder-account-outline" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_CREATE">
      <DistributionCategoryCreateButton
        :initial-asset-type="assetType"
        data-cy="button-create"
        @on-create-success="onCreateSuccess"
      />
    </Acl>
  </ActionbarButtonsWrapper>
  <ACard :loading="listLoading">
    <DistributionCategoryDatatable
      :key="assetType"
      ref="datatable"
      :distribution-service-slugs="getAvailableDistributionServiceSlugs(assetType)"
    />
  </ACard>
</template>
