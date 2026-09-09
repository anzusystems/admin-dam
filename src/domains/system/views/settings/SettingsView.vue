<script lang="ts" setup>
import {
  ALanguageSelect,
  AThemeSelect,
  type DamCurrentUserDto,
  useI18n,
  useSentry,
  useUnreleasedFeatures,
} from '@anzusystems/common-admin'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { useAuth } from '@/domains/system/auth/auth'
import { SYSTEM_DAM } from '@/shared/systems'

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(computed(() => [{ title: t('breadcrumb.settings'), routeName: '/settings' }]))

const afterLanguageChange = async () => {
  window.location.reload()
}

const { useCurrentUser } = useAuth()
const { isSuperAdmin } = useCurrentUser<DamCurrentUserDto>(SYSTEM_DAM)

const throwTestError = () => {
  throw new Error('Force Test Error - error throw')
}
const { logError } = useSentry()

const logTestError = () => {
  logError(new Error('Force Test Error - useSentry logError'), { message: 'ArticleBodyEditor: onContentError' })
}

const { showUnreleasedFeatures } = useUnreleasedFeatures()

const unreleasedToggleLabel = computed(() =>
  showUnreleasedFeatures.value
    ? t('system.settings.debug.unreleasedShow')
    : t('system.settings.debug.unreleasedHide')
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs" />

  <VCard>
    <VCardText>
      <VRow>
        <VCol cols="12">
          <VRow class="pb-2 align-center">
            <VCol cols="1">
              {{ t('system.settings.locale') }}
            </VCol>
            <VCol>
              <ALanguageSelect
                :is-administrator="isSuperAdmin"
                @after-change="afterLanguageChange"
              />
            </VCol>
          </VRow>
          <VRow class="pb-2 align-center">
            <VCol cols="1">
              {{ t('system.settings.theme') }}
            </VCol>
            <VCol>
              <AThemeSelect />
            </VCol>
          </VRow>
        </VCol>
      </VRow>
      <VRow
        v-if="isSuperAdmin"
        class="pb-2 align-center"
      >
        <VCol cols="3">
          {{ t('system.settings.debug.throwTitle') }}
        </VCol>
        <VCol>
          <VBtn @click.stop="throwTestError">
            {{ t('system.settings.debug.throwButton') }}
          </VBtn>
        </VCol>
      </VRow>
      <VRow
        v-if="isSuperAdmin"
        class="pb-2 align-center"
      >
        <VCol cols="3">
          {{ t('system.settings.debug.logTitle') }}
        </VCol>
        <VCol>
          <VBtn @click.stop="logTestError">
            {{ t('system.settings.debug.logButton') }}
          </VBtn>
        </VCol>
      </VRow>
      <VRow
        v-if="isSuperAdmin"
        class="pb-2 align-center"
      >
        <VCol cols="3">
          {{ t('system.settings.debug.unreleasedTitle') }}
        </VCol>
        <VCol>
          <VSwitch
            v-model="showUnreleasedFeatures"
            :label="unreleasedToggleLabel"
          />
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>
