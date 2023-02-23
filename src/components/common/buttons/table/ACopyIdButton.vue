<script lang="ts" setup>
import { toString } from '@/utils/number'
import { useClipboard } from '@vueuse/core'
import AIconGroup from '@/components/common/AIconGroup.vue'
import { clickBlur } from '@/utils/event'
import { useAlerts } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { isNumber, isString } from '@/utils/common'

const props = withDefaults(
  defineProps<{
    id: number | string
    buttonT?: string
    buttonClass?: string
    iconT?: string
    notifyT?: string
    dataCy?: string
    size?: 'small' | 'x-small'
  }>(),
  {
    buttonT: 'common.button.copyId',
    buttonClass: 'ml-1',
    iconT: 'common.button.id',
    notifyT: 'common.alerts.idWasCopied',
    dataCy: 'table-copy',
    size: 'x-small',
  }
)

const { t } = useI18n()
const { copy, isSupported } = useClipboard()
const { showSuccess } = useAlerts()

const onClick = (event: Event) => {
  clickBlur(event)
  if (isNumber(props.id) && props.id > 0) {
    copy(toString(props.id)).then(() => {
      showSuccess(t(props.notifyT))
    })
  } else if (isString(props.id) && props.id.length) {
    copy(props.id).then(() => {
      showSuccess(t(props.notifyT))
    })
  }
}
</script>

<template>
  <VBtn
    v-if="isSupported"
    :class="buttonClass"
    :data-cy="dataCy"
    icon
    :size="size"
    variant="text"
    @click.stop="onClick"
  >
    <AIconGroup :secondary-text="t(iconT)" main-icon="mdi-content-copy" size="small" />
    <VTooltip activator="parent" location="bottom">{{ t(buttonT) }}</VTooltip>
  </VBtn>
</template>
