import type { AclValue, DescribedPermission, PermissionDetail, Permissions } from '@/types/Permission'
import { ALL_ADMIN_PERMISSION_CATEGORIES, Grant, PermissionCategory } from '@/types/Permission'
import { i18n } from '@/plugins/i18n'

const translatePermissionSubject = (subject: string, category: PermissionCategory) => {
  const { t } = i18n.global || i18n
  if (ALL_ADMIN_PERMISSION_CATEGORIES.includes(category)) {
    return t('coreDam.permission.adminSubject.' + subject)
  }
  return t('coreDam.permission.subject.' + subject)
}

const translateGroupForAdminCategory = (group: string) => {
  const { t } = i18n.global || i18n
  return t('coreDam.permission.group.' + group)
}

const translatePermissionAction = (action: string, category: PermissionCategory) => {
  const { t } = i18n.global || i18n
  if (ALL_ADMIN_PERMISSION_CATEGORIES.includes(category)) {
    return ''
  }
  return t('coreDam.permission.action.' + action)
}

const translatePermissionCategory = (category: PermissionCategory) => {
  const { t } = i18n.global || i18n
  return t('coreDam.permission.category.' + category)
}

const getSubjectForAdminFilter = (subject: string, action: string) => {
  if (action === 'ui') {
    return 'ui_' + subject
  }
  return subject
}

export const getPermissionSubjectAndAction = (identifier: AclValue): { subject: string; action: string } => {
  const splitIdentifier = identifier.split('_')

  return { subject: (splitIdentifier[0] + '_' + splitIdentifier[1]) as string, action: splitIdentifier[2] as string }
}

export const useDescribedPermissionAction = () => {
  const setupPermissionFields = (name: AclValue, apiValues: PermissionDetail): DescribedPermission => {
    const rule = getPermissionSubjectAndAction(name)
    const subjectTitle = translatePermissionSubject(rule.subject, apiValues.ui.category)
    const subject = getSubjectForAdminFilter(rule.subject, rule.action)
    const categoryTitle = translatePermissionCategory(apiValues.ui.category)
    const actionTitle = translatePermissionAction(rule.action, apiValues.ui.category)

    return {
      name: name,
      searchIndex: [name, categoryTitle, subjectTitle, actionTitle].join(' ').toLowerCase(),
      category: apiValues.ui.category,
      categoryTitle: categoryTitle,
      categoryAndGroup: apiValues.ui.category + '_' + apiValues.ui.group,
      groupTitle: translateGroupForAdminCategory(apiValues.ui.group),
      subject: subject,
      subjectTitle: subjectTitle,
      action: rule.action,
      actionTitle: actionTitle,
      grants: apiValues.grants,
    }
  }

  const cleanUpPermissions = (permissions: Permissions) => {
    const permissionsAcls = Object.keys(permissions) as AclValue[]
    permissionsAcls.map((name: AclValue) => {
      if (permissions[name] === Grant.NotSet) {
        delete permissions[name]
      }
    })
    return permissions
  }

  return {
    setupPermissionFields,
    cleanUpPermissions,
  }
}
