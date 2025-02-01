<script lang="ts" setup>
import { ACard, AFormValueObjectOptionsSelect, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import {
  type DistributionItem,
  DistributionItemResourceName,
  type DistributionItemResourceNameType
} from '@/types/coreDam/Distribution.ts'
import { computed, ref } from 'vue'
import JwDistributionForm from '@/views/coreDam/asset/detail/components/distribution/forms/JwDistributionForm.vue'
import YoutubeDistributionForm
  from '@/views/coreDam/asset/detail/components/distribution/forms/YoutubeDistributionForm.vue'
import CustomDistributionForm
  from '@/views/coreDam/asset/detail/components/distribution/forms/CustomDistributionForm.vue'

withDefaults(
  defineProps<{
    readonly?: boolean,
    validationScope?: ValidationScope
  }>(),
  {
    readonly: false,
    validationScope: undefined,
  }
)

const distribution = defineModel<DistributionItem>({ required: true })

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

const rules = computed(() =>
  DistributionItemFormComponent(distribution.value._resourceName)
)


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
