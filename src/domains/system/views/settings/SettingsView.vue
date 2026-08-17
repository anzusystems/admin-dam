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
          DEBUG: Test throw error
        </VCol>
        <VCol>
          <VBtn @click.stop="throwTestError">
            Throw
          </VBtn>
        </VCol>
      </VRow>
      <VRow
        v-if="isSuperAdmin"
        class="pb-2 align-center"
      >
        <VCol cols="3">
          DEBUG: Test log error
        </VCol>
        <VCol>
          <VBtn @click.stop="logTestError">
            Log
          </VBtn>
        </VCol>
      </VRow>
      <VRow
        v-if="isSuperAdmin"
        class="pb-2 align-center"
      >
        <VCol cols="3">
          DEBUG: Show unreleased features
        </VCol>
        <VCol>
          <VSwitch
            v-model="showUnreleasedFeatures"
            :label="showUnreleasedFeatures ? 'Show' : 'Hide'"
          />
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>
