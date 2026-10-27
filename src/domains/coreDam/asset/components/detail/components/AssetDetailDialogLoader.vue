<script setup lang="ts">
import { useTheme } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'

/*
 * Detail bar shown while the asset loads. It knows no list.
 * The parent passes what its bar has: list navigation buttons, which one is
 * disabled, the asset position and name. Clicks are emitted as that bar would.
 */
withDefaults(
  defineProps<{
    walksList: boolean
    prevDisabled: boolean
    nextDisabled: boolean
    totalCountText: string
    title?: string
  }>(),
  { title: '' }
)
const emit = defineEmits<{ closeDialog: []; prevItem: []; nextItem: [] }>()

const { t } = useI18n()

const { toolbarColor } = useTheme()

const closeDialog = () => {
  emit('closeDialog')
}
</script>

<template>
  <VCard class="dam-image-detail">
    <div class="d-flex flex-column w-100 h-100">
      <VToolbar
        :color="toolbarColor"
        density="compact"
        :height="64"
        class="border-b"
      >
        <div v-if="walksList">
          <VBtn
            :aria-label="t('coreDam.asset.list.prev')"
            variant="text"
            icon
            class="mx-1"
            :width="36"
            :height="36"
            :disabled="prevDisabled"
            @click.stop="emit('prevItem')"
          >
            <VIcon icon="mdi-chevron-left" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              {{ t('coreDam.asset.list.prev') }}
            </VTooltip>
          </VBtn>
          <VBtn
            :aria-label="t('coreDam.asset.list.next')"
            variant="text"
            icon
            class="mr-2"
            :width="36"
            :height="36"
            :disabled="nextDisabled"
            @click.stop="emit('nextItem')"
          >
            <VIcon icon="mdi-chevron-right" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              {{ t('coreDam.asset.list.next') }}
            </VTooltip>
          </VBtn>
        </div>
        <div
          class="text-label-large d-flex"
          :class="{ 'pl-2': !walksList }"
        >
          <div
            v-if="walksList"
            class="pr-4"
          >
            {{ totalCountText }}
          </div>
          <div v-if="title">{{ title }}</div>
        </div>
        <VSpacer />
        <div>
          <VBtn
            :aria-label="t('common.button.close')"
            icon
            variant="text"
            :width="36"
            :height="36"
            class="mr-1"
            @click.stop="closeDialog"
          >
            <VIcon icon="mdi-close" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              {{ t('common.button.close') }}
            </VTooltip>
          </VBtn>
        </div>
      </VToolbar>
      <div class="d-flex w-100 h-100 justify-center align-center">
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </div>
    </div>
  </VCard>
</template>
