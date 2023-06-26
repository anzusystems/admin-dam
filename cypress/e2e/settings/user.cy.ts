/// <reference types="cypress" />

import {
  USER_LICENCE,
  EXTERNAL_PROVIDER,
  DISTRIBUTION_SERVICE,
  EXTERNAL_SYS,
  CY,
  ALERT_UPDATE,
} from '../../utils/common'
let USER_ID = ''
describe(`Test user function, Env: ${CY.cfg}`, { tags: '@user', env: { visitBaseUrl: false } }, () => {
  it('Edit User', () => {
    cy.visit('/settings')
    cy.visitSubpage('user-settings', 'user', 'Používatelia')
    cy.getCy('filter-string').last().type(`${CY.credential.admin.email}{ENTER}`)
    cy.getCyVisibleClick('filter-submit')
    cy.cardLoad()
    cy.contains(`${CY.credential.admin.email}`).click()
    cy.cardLoad()
    cy.getCy('copy-text')
      .invoke('text')
      .then((text) => {
        USER_ID = text
      })
    cy.getCy('button-edit').first().click()
    cy.getCy('user-asset-licences').click()
    USER_LICENCE.forEach((licence) => {
      cy.getCy('user-asset-licences').type(`${licence}`)
      cy.contains('.v-list-item-title', `${licence}`).click()
    })
    cy.get('#anzu-actionbar').click()
    cy.getCy('user-admin-to-ext-systems').click()
    EXTERNAL_SYS.forEach((admin) => {
      cy.contains('.v-list-item-title', `${admin}`).click()
    })
    cy.get('#anzu-actionbar').click()
    cy.getCy('user-allowed-asset-external-providers').click()
    cy.contains('.v-list-item-title', `${EXTERNAL_PROVIDER}`).click()
    cy.get('#anzu-actionbar').click()
    cy.getCy('user-allowed-distribution-services').click()
    DISTRIBUTION_SERVICE.forEach((service) => {
      cy.contains('.v-list-item-title', `${service}`).click()
    })
    cy.get('#anzu-actionbar').click()
    cy.getCyVisibleClick('button-save')
    cy.alertMessage(ALERT_UPDATE)
    cy.getCyVisibleClick('button-close')
    cy.urlNotContains('edit')
  })
  it('Reset User', () => {
    cy.visit(`/user/${USER_ID}/edit`)
    cy.cardLoad()
    cy.getCy('user-admin-to-ext-systems').click()
    EXTERNAL_SYS.forEach((admin) => {
      cy.contains('.v-list-item-title', `${admin}`).click()
    })
    cy.get('#anzu-actionbar').click()
    cy.getCy('user-allowed-asset-external-providers').click()
    cy.contains('.v-list-item-title', `${EXTERNAL_PROVIDER}`).click()
    cy.get('#anzu-actionbar').click()
    cy.getCy('user-allowed-distribution-services').click()
    DISTRIBUTION_SERVICE.forEach((service) => {
      cy.contains('.v-list-item-title', `${service}`).click()
    })
    cy.get('#anzu-actionbar').click()
    cy.getCy('user-asset-licences').click()
    USER_LICENCE.forEach((licence) => {
      cy.getCy('user-asset-licences').type(`${licence}`)
      cy.contains('.v-list-item-title', `${licence}`).click()
    })
    cy.getCyVisibleClick('button-save')
    cy.alertMessage(ALERT_UPDATE)
  })
})
