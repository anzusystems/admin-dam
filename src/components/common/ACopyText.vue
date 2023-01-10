<script lang="ts" setup>
import { toString } from '@/utils/number'
import { useClipboard } from '@vueuse/core'
import { clickBlur } from '@/utils/event'
import { isNumber, isString } from '@/utils/common'
import { useAlerts } from '@/composables/system/alerts'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    value: number | string
    notifyT?: string
    dataCy?: string
  }>(),
  {
    notifyT: 'common.alerts.textWasCopied',
    dataCy: 'copy_text',
  }
)

const { copy, isSupported } = useClipboard()
const { showSuccess } = useAlerts()
const { t } = useI18n({ useScope: 'global' })

const onClick = (event: Event) => {
  clickBlur(event)
  if (!isSupported) return
  if (isNumber(props.value)) {
    copy(toString(props.value)).then(() => {
      showSuccess(t(props.notifyT))
    })
  } else if (isString(props.value) && props.value.length) {
    copy(props.value).then(() => {
      showSuccess(t(props.notifyT))
    })
  }
}
</script>

<template>
  <div
    :class="{ 'cursor-pointer': isSupported }"
    :data-cy="dataCy"
    class="d-inline-flex align-center anzu-copy-text"
    @click.stop="onClick"
  >
    <span>{{ value }}</span>
    <VIcon v-if="isSupported" class="ml-1" size="x-small" icon="mdi-content-copy" />
    <VTooltip activator="parent" location="bottom">Copy</VTooltip>
  </div>
</template>

<style lang="scss">
.anzu-copy-text {
  .v-icon {
    opacity: 0;
  }

  &:hover {
    .v-icon {
      opacity: 1;
    }
  }
}
</style>
