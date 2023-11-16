<script lang="ts" setup>
import type { DamAssetType } from '@anzusystems/common-admin'
import { ACard } from '@anzusystems/common-admin'
import DistributionCategoryDatatable from '@/views/coreDam/distributionCategory/components/DistributionCategoryDatatable.vue'
import { useDistributionCategoryListFilter } from '@/model/coreDam/filter/DistributionCategoryFilter'
import { computed, ref } from 'vue'
import {
  useDistributionCategoryListActions,
  useDistributionCategoryManageActions,
} from '@/views/coreDam/distributionCategory/composables/distributionCategoryActions'
import DistributionCategoryCreateButton from '@/views/coreDam/distributionCategory/components/DistributionCategoryCreateButton.vue'
import { ACL } from '@/types/Permission'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const filter = useDistributionCategoryListFilter()
const { getAvailableDistributionServiceSlugs } = useDistributionCategoryManageActions()
const { listLoading } = useDistributionCategoryListActions()

const assetType = computed(() => filter.type.model as DamAssetType)

const datatable = ref<InstanceType<typeof DistributionCategoryDatatable> | null>(null)

const onCreateSuccess = (type: DamAssetType) => {
  filter.type.model = type
  datatable.value?.refresh()
}
</script>

<template>
  <ActionbarWrapper>
    <template #buttons>
      <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_CREATE">
        <DistributionCategoryCreateButton
          :initial-asset-type="assetType"
          data-cy="button-create"
          @on-create-success="onCreateSuccess"
        />
      </Acl>
    </template>
  </ActionbarWrapper>

  <ACard :loading="listLoading">
    <VCardText>
      <DistributionCategoryDatatable
        :key="assetType"
        ref="datatable"
        :distribution-service-slugs="getAvailableDistributionServiceSlugs(assetType)"
      />
    </VCardText>
  </ACard>
</template>
