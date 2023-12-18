/// <reference types="cypress" />

import {
  USER_LICENCE,
  EXTERNAL_PROVIDER,
  DISTRIBUTION_SERVICE,
  EXTERNAL_SYS,
  CY,
  ALERT_UPDATE, RAND_NUM, USER_EMAIL, USER_ROLE, ALERT_CREATE,
} from '../../utils/common'
let USER_ID = ''
describe(`Test user function, Env: ${CY.cfg}`,
  { tags: ['@user', '@settings'], env: { visitBaseUrl: false } }, () => {
    it('Create user', () => {
      cy.visit('/settings')
      cy.visitSubpage('user-permissions', '-user', 'Oprávnenia používateľov')
      cy.getCyVisibleClick('button-create')
      cy.getCy('create-panel').should('be.visible')
      cy.getCy('user-id').type(RAND_NUM)
      cy.getCy('user-email').type(USER_EMAIL)
      cy.getCyVisibleClick('user-roles')
      cy.contains('.v-list-item', USER_ROLE).click()
      cy.getCy('create-panel').click('top')
      cy.getCy('user-permissionGroups').click()
      cy.get('.v-overlay .v-list-item').first().click()
      cy.getCy('create-panel').click('top')
      cy.getCy('button-close').should('be.visible')
      cy.getCy('button-cancel').should('be.visible')
      cy.getCyVisibleClick('button-confirm')
      cy.alertMessage(ALERT_CREATE)
      cy.get('[value="50"]').click()
      cy.contains(`${USER_EMAIL}`).click()
      cy.cardLoad()
      cy.getCy('copy-text')
        .invoke('text')
        .then((text) => {
          cy.urlContains(text)
          cy.getCyVisibleClick('button-close')
          cy.urlNotContains(`/${text}`)
          cy.urlContains('-user')
          USER_ID = text
        })
    })
  it('Edit User', () => {
    cy.visit('/settings')
    cy.visitSubpage('user-settings', 'user', 'Používatelia')
    cy.getCy('filter-string').last().type(`${USER_EMAIL}{ENTER}`)
    cy.getCyVisibleClick('filter-submit')
    cy.cardLoad()
    cy.contains(`${USER_EMAIL}`).click()
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
    cy.get('body').type('{esc}')
    cy.getCy('user-admin-to-ext-systems').click()
    EXTERNAL_SYS.forEach((admin) => {
      cy.contains('.v-list-item-title', `${admin}`).click()
    })
    cy.get('body').type('{esc}')
    cy.getCy('user-allowed-asset-external-providers').click()
    cy.contains('.v-list-item-title', `${EXTERNAL_PROVIDER}`).click()
    cy.get('[aria-expanded="false"]').invoke('attr', 'aria-expanded', 'true')
    cy.getCy('user-allowed-distribution-services').click()
    DISTRIBUTION_SERVICE.forEach((service) => {
      cy.contains('.v-list-item-title', `${service}`).click()
    })
    cy.get('[aria-expanded="false"]').invoke('attr', 'aria-expanded', 'true')
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
    cy.get('body').type('{esc}')
    cy.getCy('user-allowed-asset-external-providers').click()
    cy.contains('.v-list-item-title', `${EXTERNAL_PROVIDER}`).click()
    cy.get('[aria-expanded="false"]').invoke('attr', 'aria-expanded', 'true')
    cy.getCy('user-allowed-distribution-services').click()
    DISTRIBUTION_SERVICE.forEach((service) => {
      cy.contains('.v-list-item-title', `${service}`).click()
    })
    cy.get('[aria-expanded="false"]').invoke('attr', 'aria-expanded', 'true')
    cy.getCy('user-asset-licences').click()
    USER_LICENCE.forEach((licence) => {
      cy.getCy('user-asset-licences').type(`${licence}`)
      cy.contains('.v-list-item-title', `${licence}`).click()
    })
    cy.getCyVisibleClick('button-save')
    cy.alertMessage(ALERT_UPDATE)
  })
})
