<script lang="ts" setup>
import {
  AFormValueObjectOptionsSelect,
  ARow,
  useDamConfigStore,
  type ValidationScope,
} from '@anzusystems/common-admin'
import {
  DistributionItemResourceName,
  type YoutubeDistributionUpdateDto
} from '@/types/coreDam/Distribution.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  useYoutubeDistributionUpdateDtoValidations
} from '@/views/coreDam/asset/detail/composables/distributionValidations.ts'

const props = withDefaults(
  defineProps<{
    readonly?: boolean,
    validationScope?: ValidationScope
  }>(),
  {
    readonly: false,
    validationScope: undefined,
  }
)

const damConfigStore = useDamConfigStore()

const distributionServices = computed(() => {
  return Object.entries(damConfigStore.damPrvConfig.distributionServices)
    .filter(([key, value]) => value.type === DistributionItemResourceName.Youtube)
    .map(([key, value]) => {
      return {
        title: value.title,
        value: key,
      }
    })
})

const distribution = defineModel<YoutubeDistributionUpdateDto>({ required: true })

const { t } = useI18n()

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const { v$ } = useYoutubeDistributionUpdateDtoValidations(distribution, props.validationScope)

</script>

<template>
  <ARow>
    <AFormValueObjectOptionsSelect
      :label="t('coreDam.youtubeDistribution.model.distributionService')"
      v-model="distribution.distributionService"
      :items="distributionServices"
      :readonly="readonly"
      :v="v$.distribution.distributionService"
    />
  </ARow>
</template>
