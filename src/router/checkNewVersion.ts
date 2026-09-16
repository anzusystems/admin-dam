import { useSystemBar } from '@anzusystems/common-admin'
import { requestAppReload } from '@/appReload'

export function checkForNewVersion() {
  const { newVersion } = useSystemBar()
  if (!newVersion.value) return false
  return requestAppReload()
}
