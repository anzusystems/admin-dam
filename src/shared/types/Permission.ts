import type { GrantType } from '@anzusystems/common-admin'

export type Permissions<TAclValue extends string = string> = {
  [key in TAclValue]?: GrantType
}
