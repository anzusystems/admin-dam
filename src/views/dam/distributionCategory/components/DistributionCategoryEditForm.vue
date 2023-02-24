<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/distributionCategoryApi'
import { AFormTextField, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import { useDistributionCategoryEditActions } from '@/views/dam/distributionCategory/composables/distributionCategoryActions'
import { useDistributionCategoryValidation } from '@/views/dam/distributionCategory/composables/distributionCategoryValidation'
import DistributionCategorySelectOptionSelect from '@/views/dam/distributionCategorySelect/components/DistributionCategorySelectOptionSelect.vue'

const { distributionCategory, distributionCategorySelects, distributionCategorySelectedOptions } =
  useDistributionCategoryEditActions()
const { v$ } = useDistributionCategoryValidation(distributionCategory)
</script>

<template>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <VRow>
      <VCol cols="12" md="8">
        <ARow>
          <AFormTextField
            v-model="distributionCategory.name"
            :v="v$.distributionCategory.name"
            data-cy="category-name"
          />
        </ARow>
        <ARow
          v-for="distributionCategorySelect in distributionCategorySelects"
          :key="distributionCategorySelect.serviceSlug"
          class="mt-5"
        >
          <DistributionCategorySelectOptionSelect
            v-model="distributionCategorySelectedOptions[distributionCategorySelect.serviceSlug]"
            :select="distributionCategorySelect"
          >
          </DistributionCategorySelectOptionSelect>
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
