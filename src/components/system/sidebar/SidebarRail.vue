<script lang="ts" setup></script>

<template>
  <div />
  <!--  <VList-->
  <!--    density="compact"-->
  <!--    nav-->
  <!--    color="primary"-->
  <!--  >-->
  <!--    <VListItem-->
  <!--      v-if="-->
  <!--        canForSome([-->
  <!--          ACL.WEATHER_LOCATION_UI,-->
  <!--          ACL.WEATHER_LOCATION_GROUP_UI,-->
  <!--          ACL.WEATHER_LOCATION_GROUP_SUMMARY_SETUP_UI,-->
  <!--          ACL.WEATHER_TOURIST_DESTINATION_UI,-->
  <!--          ACL.WEATHER_JOB_UI,-->
  <!--          ACL.WEATHER_FORECAST_DAILY_GROUP_SUMMARY_UI,-->
  <!--        ])-->
  <!--      "-->
  <!--      :title="t('sidebar.weather.header')"-->
  <!--      :to="{ name: ROUTE.WEATHER.HOME }"-->
  <!--      prepend-icon="mdi-weather-sunny"-->
  <!--    >-->
  <!--      <VTooltip-->
  <!--        location="right"-->
  <!--        activator="parent"-->
  <!--      >-->
  <!--        {{ t('sidebar.weather.header') }}-->
  <!--      </VTooltip>-->
  <!--    </VListItem>-->
  <!--    <VListItem-->
  <!--      v-if="-->
  <!--        canForSome([-->
  <!--          ACL.SMS_GATEWAY_SMS_MESSAGE_RECEIVE_UI,-->
  <!--          ACL.SMS_GATEWAY_SMS_MESSAGE_SEND_UI,-->
  <!--          ACL.SMS_GATEWAY_PHONE_NUMBER_UI,-->
  <!--          ACL.SMS_GATEWAY_PHONE_NUMBER_BLOCK_UI,-->
  <!--          ACL.SMS_GATEWAY_SMS_CODE_UI,-->
  <!--          ACL.SMS_GATEWAY_SMS_CODE_TYPE_UI,-->
  <!--          ACL.SMS_GATEWAY_SMS_CODE_BLOCK_WORD_UI,-->
  <!--          ACL.SMS_GATEWAY_EXT_SYSTEM_UI,-->
  <!--        ])-->
  <!--      "-->
  <!--      :title="t('sidebar.smsGateway.header')"-->
  <!--      :to="{ name: ROUTE.SMS_GATEWAY.PHONE_NUMBER_BLOCK.LIST }"-->
  <!--      prepend-icon="mdi-cellphone"-->
  <!--    >-->
  <!--      <VTooltip-->
  <!--        location="right"-->
  <!--        activator="parent"-->
  <!--      >-->
  <!--        {{ t('sidebar.smsGateway.header') }}-->
  <!--      </VTooltip>-->
  <!--    </VListItem>-->
  <!--  </VList>-->
</template>
