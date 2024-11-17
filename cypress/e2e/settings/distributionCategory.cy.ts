/// <reference types="cypress" />

import { ALERT_CREATE, ALERT_UPDATE, CY, RAND_NUM, USER_FIRST_NAME } from '../../utils/common'

describe(
  `Test distribution category function, Env: ${CY.cfg}`,
  { tags: ['@distributionCategory', '@settings'], env: { visitBaseUrl: false } }, () => {
    if (CY.cfg === 'local'){
      //if not - create
      it('Create "Podcasty" in artemis_podcast_cms', () => {
        cy.visit('/distribution-category-select')
        cy.cardLoad()
        cy.getCy('filter-value').click()
        cy.get('.v-list-item').contains('Audio').click()
        cy.cardLoad()
        cy.get('.v-data-table__tr').contains('td', 'artemis_podcast_cms')
          .parent('.v-data-table__tr').find('[data-cy="table-edit"]').click()
        cy.cardLoad()
        cy.getCy('button-add-option').click()
        cy.getCy('option-name').last().type('Podcasty')
        cy.getCy('option-id').last().type(RAND_NUM)
        cy.getCyVisibleClick('button-save')
        cy.alertMessage(ALERT_UPDATE)
      })
    }

    it('Create distribution category', () => {
      cy.visit('/settings')
      cy.visitSubpage('distribution-category-settings', 'distribution-category', 'Kategórie distribúcie')
      cy.getCyVisibleClick('button-create')
      cy.getCy('create-panel').should('be.visible')
      cy.getCy('category-type').should('be.visible').click()
      cy.get('.v-overlay__content > .v-list > .v-list-item').contains('Audio').click()
      cy.getCy('category-name').should('be.visible').type(USER_FIRST_NAME)
      cy.getCy('distribution-category-select').eq(1).click()
      cy.get('.v-overlay__content > .v-list > .v-list-item').contains('Podcasty').click()
      cy.getCy('button-close').should('be.visible')
      cy.getCy('button-cancel').should('be.visible')
      cy.getCyVisibleClick('button-confirm')
      cy.alertMessage(ALERT_CREATE)
      cy.contains(`${USER_FIRST_NAME}`).click()
      cy.cardLoad()
      cy.getCy('copy-text')
        .invoke('text')
        .then((text) => {
          cy.urlContains(text)
          cy.getCyVisibleClick('button-close')
          cy.urlNotContains(text)
          cy.urlContains('/distribution-category')
        })
    })
    it('Edit distribution category', () => {
      cy.visit('distribution-category')
      cy.getCy('filter-value').click()
      cy.get('.v-list-item').contains('Audio').click()
      cy.cardLoad()
      cy.getCy('filter-string').type(`${USER_FIRST_NAME}{ENTER}`)
      cy.cardLoad()
      cy.getCyVisibleClick('table-edit')
      cy.urlContains('/edit')
      cy.getCy('category-name').find('input').clear().type(`${USER_FIRST_NAME}-do-not-use`)
      cy.getCy('button-close').should('be.visible')
      cy.getCyVisibleClick('button-save')
      cy.alertMessage(ALERT_UPDATE)
      cy.getCyVisibleClick('button-close')
      cy.urlNotContains('/edit')
      cy.getCyVisibleClick('filter-reset')
      cy.getCy('filter-value').click()
      cy.get('.v-list-item').contains('Audio').click()
      cy.getCy('filter-string').type(`${USER_FIRST_NAME}-do-not-use{ENTER}`)
      cy.cardLoad()
      cy.contains('td', `${USER_FIRST_NAME}-do-not-use`)
      cy.getCyVisibleClick('filter-reset')
    })
  }
)
