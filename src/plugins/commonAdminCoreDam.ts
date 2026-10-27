import type { CommonAdminCoreDamOptions } from '@anzusystems/common-admin'

import { damClient } from '@/shared/apiClients/damClient'

type CoreDamConfig = NonNullable<CommonAdminCoreDamOptions>['configs'][string]

// The `default` config of the library's DAM blocks. App start-up and the tests that install the plugin both read it.
// A test with its own copy would not see a grant added here.
export const coreDamDefaultConfig: CoreDamConfig = {
  damClient,
  keywordCreateAcl: 'dam_keyword_create',
  authorCreateAcl: 'dam_author_create',
}
