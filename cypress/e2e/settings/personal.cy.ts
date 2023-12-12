/// <reference types="cypress" />

import { LENGUAGE_SK, LENGUAGE_EN, THEME_LIGHT, THEME_DARK, THEME_AUTO, CY } from '../../utils/common'

describe(`Test personal settings, Env: ${CY.cfg}`,
  { tags: ['@personal', '@settings'] }, () => {
  it('Personal settings', () => {
    cy.getCyVisibleClick('navbar-user', 10000)
    cy.getCyVisibleClick('navbar-user-settings')
    cy.get('.v-breadcrumbs-item__text').should('contain.text', 'Nastavenia')
    cy.get('.v-container').should('exist').and('be.visible')
    cy.urlContains('/settings')
    cy.getCyVisibleClick('settings-language')
    cy.contains('.v-list-item-title', `${LENGUAGE_SK}`).click()
    cy.getCy('personal-settings').should('contain', 'Osobné')
    cy.contains('.v-list-item-title', `${LENGUAGE_EN}`).click()
    cy.getCy('personal-settings').should('contain', 'Personal')
    cy.getCy('settings-language').click()
    cy.getCyVisibleClick('settings-theme')
    cy.contains('.v-list-item-title', `${THEME_LIGHT}`)
    cy.contains('.v-list-item-title', `${THEME_DARK}`)
    cy.contains('.v-list-item-title', `${THEME_AUTO}`)
    cy.getCy('settings-theme').click()
  })
})
