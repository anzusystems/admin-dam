import { ACL } from '@/domains/system/auth/auth'

const AUTHOR_SECTION = {
  routeList: '/(coreDam)/authors',
  routeDetail: '/(coreDam)/authors/[id]',
  routeEdit: '/(coreDam)/authors/[id]/edit',
  breadcrumbList: 'breadcrumb.coreDam.author.list',
  breadcrumbDetail: 'breadcrumb.coreDam.author.detail',
  breadcrumbEdit: 'breadcrumb.coreDam.author.edit',
  aclCreate: ACL.DAM_AUTHOR_CREATE,
  aclUpdate: ACL.DAM_AUTHOR_UPDATE,
} as const

const SOURCE_SECTION = {
  routeList: '/(coreDam)/sources',
  routeDetail: '/(coreDam)/sources/[id]',
  routeEdit: '/(coreDam)/sources/[id]/edit',
  breadcrumbList: 'breadcrumb.coreDam.source.list',
  breadcrumbDetail: 'breadcrumb.coreDam.source.detail',
  breadcrumbEdit: 'breadcrumb.coreDam.source.edit',
  aclCreate: ACL.DAM_SOURCE_CREATE,
  aclUpdate: ACL.DAM_SOURCE_UPDATE,
} as const

export const getAuthorSection = (source: boolean) => (source ? SOURCE_SECTION : AUTHOR_SECTION)
