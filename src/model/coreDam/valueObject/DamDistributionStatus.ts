import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@anzusystems/common-admin'

export enum DamDistributionStatus {
  Waiting = 'waiting',
  Distributing = 'distributing',
  RemoteProcessing = 'remote_processing',
  Distributed = 'distributed',
  Failed = 'failed',
  Default = Waiting,
}

export function useDistributionStatus() {
  const { t } = useI18n()

  const DistributionStatusOptions = ref<ValueObjectOption<DamDistributionStatus>[]>([
    {
      value: DamDistributionStatus.Waiting,
      title: t('coreDam.distribution.distributionStatus.waiting'),
      color: 'default',
    },
    {
      value: DamDistributionStatus.Distributing,
      title: t('coreDam.distribution.distributionStatus.distributing'),
      color: 'warning',
    },
    {
      value: DamDistributionStatus.RemoteProcessing,
      title: t('coreDam.distribution.distributionStatus.remoteProcessing'),
      color: 'primary',
    },
    {
      value: DamDistributionStatus.Distributed,
      title: t('coreDam.distribution.distributionStatus.distributed'),
      color: 'success',
    },
    {
      value: DamDistributionStatus.Failed,
      title: t('coreDam.distribution.distributionStatus.failed'),
      color: 'error',
    },
  ])

  const getDistributionStatusOption = (value: DamDistributionStatus) => {
    return DistributionStatusOptions.value.find((item) => item.value === value)
  }

  return {
    DistributionStatusOptions,
    getDistributionStatusOption,
  }
}
