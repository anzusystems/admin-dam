<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useSimpleLoginActions } from '@/views/system/composables/loginActions'
import ABtn from '@/components/common/buttons/ABtn.vue'

const { t } = useI18n({ useScope: 'global' })

const { simpleLoginForm, onLogin } = useSimpleLoginActions()

const onSubmit = () => {
  onLogin()
}
</script>

<template>
  <div class="py-5 d-flex justify-center align-center">
    <div class="login-form pa-4 system-border-a" data-cy="login-form">
      <h1 class="display-1 my-3">
        ADAM
        <svg width="1000" height="623" class="logo-login pr-10 pb-5">
          <use xlink:href="#svg-logo"></use>
        </svg>
      </h1>
      <h4 class="mb-3 body-1">
        <span>{{ t('auth.simpleLogin.description') }}</span>
      </h4>
      <VForm>
        <VTextField
          v-model="simpleLoginForm.username"
          :label="t('auth.simpleLogin.form.username')"
          type="text"
          data-cy="username"
        />
        <VTextField
          v-model="simpleLoginForm.password"
          :label="t('auth.simpleLogin.form.password')"
          type="password"
          data-cy="password"
        />
      </VForm>
      <ABtn
        btn-helper="login"
        @click.stop="onSubmit"
        color="primary"
        size="large"
        variant="flat"
        data-cy="button-login"
      >
        {{ t('auth.simpleLogin.buttons.login') }}
      </ABtn>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-form {
  width: 400px;
  border-radius: 5px;
}

.logo-login {
  display: none;
  height: 200px;
  width: auto;
}
</style>
