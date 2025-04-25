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
} from '@/types/coreDam/Distribution'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  useYoutubeDistributionUpdateDtoValidations
} from '@/views/coreDam/asset/detail/composables/distributionValidations'

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
    .filter(([, value]) => value.type === DistributionItemResourceName.Youtube)
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
      v-model="distribution.distributionService"
      :label="t('coreDam.youtubeDistribution.model.distributionService')"
      :items="distributionServices"
      :readonly="readonly"
      :v="v$.distribution.distributionService"
    />
  </ARow>
</template>
