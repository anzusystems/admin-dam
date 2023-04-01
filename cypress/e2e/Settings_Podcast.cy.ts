/// <reference types="cypress" />

import { PODCAST_TITLE } from './support/constants'

describe(`Test Podcast function, Env: ${Cypress.env('env')}`, () => {
  it('Create podcast', () => {
    cy.visit('/settings')
    cy.getCyVisibleClick('podcast-settings')
    cy.getCyVisibleClick('button-create')
    cy.getCy('create-panel').should('be.visible')
    cy.getCy('podcast-title').type(PODCAST_TITLE)
    cy.getCy('podcast-description').type(Cypress._.repeat(PODCAST_TITLE, 3))
    cy.getCy('podcast-mode').click()
    cy.get('.v-list-item-title')
      .contains(/^Not import$/)
      .click()
    cy.getCy('podcast-rss-url').type(`https://${PODCAST_TITLE}.com`)
    cy.getCy('button-close').should('be.visible')
    cy.getCy('button-cancel').should('be.visible')
    cy.getCyVisibleClick('button-create-podcast')
    cy.alertMessage('Record was created')
    cy.getCy('podcast-id').should('be.visible').invoke('text').as('podcastId')
  })
  it('Create episode', () => {
    cy.visit('/podcast/list')
    cy.contains('[data-cy="filter-text"]', 'Title').should('be.visible').type(`${PODCAST_TITLE}{ENTER}`)
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500)
    cy.contains('td', `${PODCAST_TITLE}`).should('be.visible').click()
    cy.getCy('podcast-id').should('be.visible')
    cy.getCyVisibleClick('button-create')
    cy.getCy('create-panel').should('be.visible')
    cy.getCy('episode-title').type(PODCAST_TITLE)
    cy.getCy('episode-description').type(Cypress._.repeat(PODCAST_TITLE, 3))
    cy.getCy('episode-season-number').type(`${Cypress._.random(1, 1000)}`)
    cy.getCy('episode-number').type(`${Cypress._.random(1, 1000)}`)
    cy.getCy('button-close').should('be.visible')
    cy.getCy('button-cancel').should('be.visible')
    cy.getCyVisibleClick('button-confirm')
    cy.alertMessage('Record was created')
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500)
    cy.getCy('button-close').click()
    cy.getCy('podcast-list').should('be.visible')
    cy.getCyVisibleClick('episode-list')
    cy.contains('td', `${PODCAST_TITLE}`)
  })
})
