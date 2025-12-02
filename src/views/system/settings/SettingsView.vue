<script lang="ts" setup>
import {
  ALanguageSelect,
  AThemeSelect,
  AvailableLanguagesSymbol,
  type DamCurrentUserDto,
  DefaultLanguageSymbol,
  type LanguageCode,
  modifyLanguageSettings,
  useSentry,
  useUnreleasedFeatures,
} from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { inject } from 'vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { useAuth } from '@/composables/auth/auth'
import { SYSTEM_DAM } from '@/model/systems'

const { t } = useI18n()
const configAvailableLanguages = inject<LanguageCode[]>(AvailableLanguagesSymbol, [])
const configDefaultLanguage = inject<LanguageCode>(DefaultLanguageSymbol, 'en')
const { addMessages } = modifyLanguageSettings(configAvailableLanguages, configDefaultLanguage)

const loadLanguageMessages = async (code: LanguageCode | 'default') => {
  if (code === 'default' || code === 'xx') return
  try {
    const messages = await import(`../../../locales/${code}.ts`)
    addMessages(code, messages.default)
  } catch (e) {
    console.error('Unable to load language translation messages.')
  }
}

const afterLanguageChange = async (language: LanguageCode) => {
  await loadLanguageMessages(language)
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
  <ActionbarWrapper />

  <VCard>
    <VCardText>
      <VRow>
        <VCol cols="12">
          <VRow
            align="center"
            class="pb-2"
          >
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
          <VRow
            align="center"
            class="pb-2"
          >
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
        align="center"
        class="pb-2"
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
        align="center"
        class="pb-2"
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
        align="center"
        class="pb-2"
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
