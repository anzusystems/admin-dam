<script lang="ts" setup>
import {
  ADialogToolbar,
  AFormTextarea, AFormTextField,
  ARow,
  useAlerts,
  useValidate,
} from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import type { Editor } from '@tiptap/core'
import { useLink } from '@/components/anzutap/marks/link/composables/useLink'
import { computed, nextTick, ref, watch } from 'vue'
import useVuelidate from '@vuelidate/core'

const props = withDefaults(
  defineProps<{
    editor: Editor | undefined
  }>(),
  {}
)

const { t } = useI18n()
const { showValidationError } = useAlerts()

const linkComposable = useLink(props.editor)
const { dialog, updateLinkFromState, currentLink, insertMode, getLinkData } = linkComposable

const confirmLoading = ref(false)

const onClose = () => {
  dialog.value = false
}

const onConfirm = async () => {
  confirmLoading.value = true
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    confirmLoading.value = false
    return
  }
  await updateLinkFromState()
  dialog.value = false
  confirmLoading.value = false
}

watch(dialog, (newValue, oldValue) => {
  if (newValue === oldValue) return
  if (newValue === false) {
    v$.value.$reset()
    return
  }
  // When dialog opens, load link data
  if (props.editor && props.editor.storage.link) {
    getLinkData()
  }
})

const { maxLength, minLength, required, url } = useValidate()

const rules = computed(() => ({
  text: {
    ...(insertMode.value ? { required } : {}),
    minLength: minLength(1),
    maxLength: maxLength(4000),
  },
  href: {
    required,
    url,
  },
}))

const v$ = useVuelidate(rules, currentLink, { $stopPropagation: true })
</script>

<template>
  <VDialog
    :model-value="dialog"
    :width="500"
    :retain-focus="false"
  >
    <VCard v-if="dialog">
      <ADialogToolbar @on-cancel="onClose">
        {{ t('common.model.link') }}
      </ADialogToolbar>
      <VCardText>
        <ARow v-if="insertMode">
          <AFormTextarea
            v-model="currentLink.text"
            :label="t('common.model.text')"
            :v="v$.text"
            required
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="currentLink.href"
            :label="t('common.model.url')"
            :v="v$.href"
            required
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="currentLink.nofollow"
            :label="t('common.model.nofollow')"
            class="mt-0"
          />
        </ARow>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <ABtnTertiary @click.stop="onClose">
          {{ t('common.button.cancel') }}
        </ABtnTertiary>
        <ABtnPrimary
          :loading="confirmLoading"
          @click.stop="onConfirm"
        >
          {{ t('common.button.confirm') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style lang="scss" scoped>
.link-panel {
  background-color: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
