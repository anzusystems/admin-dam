<script lang="ts" setup>
import {
  ADialogToolbar,
  AFormTextarea,
  ARow,
  isNull,
  isUndefined,
  useAlerts,
  useValidate,
} from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import type { Editor } from '@tiptap/core'
import { useLink } from '@/components/anzutap/marks/link/composables/useLink'
import { computed, nextTick, ref, watch } from 'vue'
import EmbedLink from '@/components/anzutap/components/EmbedLink.vue'
import useVuelidate from '@vuelidate/core'

const props = withDefaults(
  defineProps<{
    editor: Editor | undefined
  }>(),
  {}
)

const { t } = useI18n()
const { showValidationError } = useAlerts()
const embedLinkInstance = ref<InstanceType<typeof EmbedLink> | null>(null)

const linkComposable = useLink(props.editor)
const { dialog, updateLinkFromState, currentLink, insertMode, getLinkData } = linkComposable

const confirmLoading = ref(false)

const onClose = () => {
  dialog.value = false
}

const validateLink = async (): Promise<boolean> => {
  if (isNull(embedLinkInstance.value) || isUndefined(embedLinkInstance.value)) {
    return false
  }
  return await embedLinkInstance.value?.validate()
}

const onConfirm = async () => {
  confirmLoading.value = true
  vText$.value.$touch()
  const linkValid = await validateLink()
  if (vText$.value.$invalid || !linkValid) {
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
    embedLinkInstance.value?.resetValidate()
    return
  }
  // When dialog opens, load link data
  getLinkData()
  nextTick(() => {
    embedLinkInstance.value?.focusFirst()
  })
})

const { maxLength, minLength, requiredIf } = useValidate()

const rules = computed(() => {
  return {
    text: {
      required: requiredIf(() => {
        return insertMode.value
      }),
      minLength: minLength(1),
      maxLength: maxLength(4000),
    },
  }
})

const vText$ = useVuelidate(rules, currentLink, { $stopPropagation: true })
</script>

<template>
  <VExpandTransition>
    <div
      v-if="dialog"
      class="link-panel pa-4"
    >
      <div class="d-flex align-center mb-3">
        <span class="text-subtitle-1 font-weight-medium">{{ t('common.model.link') }}</span>
        <VSpacer />
        <VBtn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="onClose"
        />
      </div>
      <ARow>
        <AFormTextarea
          v-if="insertMode"
          v-model="currentLink.text"
          :label="t('common.model.text')"
          :v="vText$.text"
          required
        />
      </ARow>
      <EmbedLink
        ref="embedLinkInstance"
        v-model:link="currentLink"
        required
        :nofollow-enabled="true"
      />
      <div class="d-flex justify-end mt-3 ga-2">
        <ABtnTertiary @click.stop="onClose">
          {{ t('common.button.cancel') }}
        </ABtnTertiary>
        <ABtnPrimary
          :loading="confirmLoading"
          @click.stop="onConfirm"
        >
          {{ t('common.button.confirm') }}
        </ABtnPrimary>
      </div>
    </div>
  </VExpandTransition>
</template>

<style lang="scss" scoped>
.link-panel {
  background-color: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
