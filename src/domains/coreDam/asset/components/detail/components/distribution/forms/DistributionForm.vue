<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import type { ValidationScope } from '@anzusystems/common-admin'
import { computed } from 'vue'

import CustomDistributionForm from '@/domains/coreDam/asset/components/detail/components/distribution/forms/CustomDistributionForm.vue'
import JwDistributionForm from '@/domains/coreDam/asset/components/detail/components/distribution/forms/JwDistributionForm.vue'
import YoutubeDistributionForm from '@/domains/coreDam/asset/components/detail/components/distribution/forms/YoutubeDistributionForm.vue'
import { DistributionItemResourceName } from '@/domains/coreDam/asset/types/Distribution'
import type {
  DistributionItemResourceNameType,
  DistributionUpdateDto,
} from '@/domains/coreDam/asset/types/Distribution'

withDefaults(
  defineProps<{
    readonly?: boolean
    validationScope?: ValidationScope
  }>(),
  {
    readonly: false,
    validationScope: undefined,
  }
)

const distribution = defineModel<DistributionUpdateDto>({ required: true })

const DistributionItemFormComponent = (resourceName: DistributionItemResourceNameType) => {
  switch (resourceName) {
    case DistributionItemResourceName.Jw:
      return JwDistributionForm
    case DistributionItemResourceName.Youtube:
      return YoutubeDistributionForm
    case DistributionItemResourceName.Custom:
      return CustomDistributionForm
    default:
      throw new Error(`Not found form component for distribution "${resourceName}".`)
  }
}

const rules = computed(() => DistributionItemFormComponent(distribution.value._resourceName))
</script>

<template>
  <ACard class="pt-5">
    <component
      :is="rules"
      v-model="distribution"
      :readonly="readonly"
      :validation-scope="validationScope"
    />
  </ACard>
</template>
