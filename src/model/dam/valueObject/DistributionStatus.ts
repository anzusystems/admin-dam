import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@/types/ValueObject'

export enum DistributionStatus {
  Waiting = 'waiting',
  Distributing = 'distributing',
  RemoteProcessing = 'remote_processing',
  Distributed = 'distributed',
  Failed = 'failed',
  Default = Waiting,
}

export function useDistributionStatus() {
  const { t } = useI18n()

  const DistributionStatusOptions = ref<ValueObjectOption<DistributionStatus>[]>([
    {
      value: DistributionStatus.Waiting,
      title: t('coreDam.distribution.distributionStatus.waiting'),
      color: 'default',
    },
    {
      value: DistributionStatus.Distributing,
      title: t('coreDam.distribution.distributionStatus.distributing'),
      color: 'warning',
    },
    {
      value: DistributionStatus.RemoteProcessing,
      title: t('coreDam.distribution.distributionStatus.remoteProcessing'),
      color: 'primary',
    },
    {
      value: DistributionStatus.Distributed,
      title: t('coreDam.distribution.distributionStatus.distributed'),
      color: 'success',
    },
    {
      value: DistributionStatus.Failed,
      title: t('coreDam.distribution.distributionStatus.failed'),
      color: 'error',
    },
  ])

  const getDistributionStatusOption = (value: DistributionStatus) => {
    return DistributionStatusOptions.value.find((item) => item.value === value)
  }

  return {
    DistributionStatusOptions,
    getDistributionStatusOption,
  }
}
