/// <reference types="cypress" />

import { ALERT_CREATE, ALERT_UPDATE, CY, EPISODE_TITLE, PODCAST_TITLE } from '../../utils/common'
let PODCAST_ID = '1ee119cd-a1a4-6230-825d-3bc846d5b059'
let EPISODE_ID = ''
describe(`Test Podcast function, Env: ${CY.cfg}}`, { env: { visitBaseUrl: false } }, () => {
  it('Create podcast', () => {
    cy.visit('/settings')
    cy.visitSubpage('podcast-settings', 'podcast', 'Podcasty')
    cy.getCyVisibleClick('button-create')
    cy.getCy('create-panel').should('be.visible')
    cy.getCy('podcast-title').type(PODCAST_TITLE)
    cy.getCy('podcast-description').type(Cypress._.repeat(PODCAST_TITLE, 3))
    cy.getCy('podcast-mode').click()
    cy.get('.v-list-item-title')
      .contains(/^Neimportovaný$/)
      .click()
    cy.getCy('podcast-rss-url').type(`https://${PODCAST_TITLE}.com`)
    cy.get('.mdi-calendar').click()
    cy.get('[data-index="0"]').click()
    cy.getCy('button-close').should('be.visible')
    cy.getCy('button-cancel').should('be.visible')
    cy.getCy('button-create').last().click()
    cy.alertMessage(ALERT_CREATE)
    cy.getCy('filter-submit').click() // until bug is fixed
    cy.contains(`${PODCAST_TITLE}`).click() // until bug is fixed
    cy.cardLoad()
    cy.getCyVisibleClick('podcast-list')
    cy.getCy('podcast-id')
      .invoke('text')
      .then((text) => {
        cy.urlContains(text)
        cy.getCyVisibleClick('button-close')
        cy.urlNotContains(text)
        cy.urlContains('/podcast')
        PODCAST_ID = text
      })
  })
  it('Edit podcast', () => {
    cy.visit('/podcast')
    cy.getCy('filter-string').first().type(`${PODCAST_ID}{ENTER}`)
    cy.cardLoad()
    cy.getCyVisibleClick('table-edit')
    cy.urlContains('/edit')
    cy.cardLoad()
    //eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getCy('podcast-title').find('input').clear().type(`${PODCAST_TITLE}-edit`)
    //eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getCy('podcast-description').clear().type(`${PODCAST_TITLE}-edit-description`)
    //eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getCy('podcast-rss-url').find('input').clear().type(`https://${PODCAST_TITLE}-edit.com`)
    // cy.getCy('select-image-preview').within(() => {
    //   cy.get('button').click()
    //   cy.get('.asset-list-tiles').first().click()
    //   cy.contains('button', 'Zvoliť').click()
    // })
    // cy.getCy('select-image-alt').within(() => {
    //   cy.get('button').click()
    //   cy.get('.asset-list-tiles__item').eq(1).click()
    //   cy.contains('button', 'Zvoliť').click()
    // })
    cy.getCyVisibleClick('button-save')
    cy.alertMessage(ALERT_UPDATE)
    cy.getCyVisibleClick('button-close')
    cy.urlNotContains('/edit')
    cy.getCyVisibleClick('filter-reset')
  })
  it('Create episode', () => {
    cy.visit(`/podcast/${PODCAST_ID}`)
    cy.getCyVisibleClick('button-create', 10000)
    cy.getCy('create-panel').should('be.visible')
    cy.getCy('episode-title').type(EPISODE_TITLE)
    cy.getCy('episode-description').type(Cypress._.repeat(EPISODE_TITLE, 3))
    cy.getCy('episode-season-number').type(`${Cypress._.random(1, 1000)}`)
    cy.getCy('episode-number').type(`${Cypress._.random(1, 1000)}`)
    cy.getCy('button-close').should('be.visible')
    cy.getCy('button-cancel').should('be.visible')
    cy.getCy('button-create').last().click()
    cy.alertMessage(ALERT_CREATE)
    cy.getCy('filter-submit').click() // until bug is fixed
    cy.contains(`${EPISODE_TITLE}`).click() // until bug is fixed
    cy.cardLoad()
    cy.getCy('copy-text')
      .invoke('text')
      .then((text) => {
        cy.urlContains(text)
        cy.getCyVisibleClick('button-close')
        cy.urlNotContains(text)
        cy.urlContains('/podcast')
        EPISODE_ID = text
      })
  })
  it('Edit episode', () => {
    cy.visit(`/podcast/${PODCAST_ID}`)
    cy.getCy('filter-string', 10000).first().type(`${EPISODE_ID}{ENTER}`)
    cy.cardLoad()
    cy.getCyVisibleClick('table-edit')
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getCy('episode-title').find('input').clear().type(`${EPISODE_TITLE}-edit`)
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getCy('episode-description').clear().type(`${EPISODE_TITLE}-edit-description`)
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getCy('episode-season-number')
      .find('input')
      .clear()
      .type(`${Cypress._.random(1, 1000)}`)
    // eslint-disable-next-line cypress/unsafe-to-chain-command
    cy.getCy('episode-number')
      .find('input')
      .clear()
      .type(`${Cypress._.random(1, 1000)}`)
    cy.getCy('episode-ext-id').type(`${Cypress._.random(1, 1000)}`)
    cy.get('.mdi-calendar').click()
    cy.get('[data-index="0"]').click()
    // cy.getCy('select-image-preview').within(() => {
    //   cy.get('button').click()
    //   cy.get('.asset-list-tiles').first().click()
    //   cy.contains('button', 'Zvoliť').click()
    // })
    cy.getCyVisibleClick('button-save')
    cy.alertMessage(ALERT_UPDATE)
    cy.getCyVisibleClick('button-close')
    cy.urlNotContains('/edit')
    cy.getCyVisibleClick('filter-reset')
  })
  it('Delete episode', () => {
    cy.visit(`/podcast/${PODCAST_ID}/episode/${EPISODE_ID}`)
    cy.cardLoad()
    cy.getCyVisibleClick('button-delete')
    cy.getCyVisibleClick('button-confirm-delete')
    cy.urlContains('/episode')
    cy.getCyVisibleClick('filter-reset')
    cy.contains(`${EPISODE_ID}`).should('not.exist')
  })
})
