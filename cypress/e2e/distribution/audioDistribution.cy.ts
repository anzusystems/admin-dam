/// <reference types="cypress" />

import {
  CY,
  ASSET_TITLE,
  ASSET_DESCRIPTION,
  ALERT_CREATE
} from '../../utils/common'
const ASSET_ID: Array<string> = []
const DISTRIBUTION_DATA={
  PODCAST: 'Dobré ráno',
  CATEGORY: 'Podcasty',
  AUTHOR: 'Boris Zemko',
  KEYWORD: 'Aupark',
}

describe(`Test distribution Audio function, Env: ${CY.cfg}`,
  { tags: ['@distributionAudio', '@distribution'] }, () => {
    it('Prepare Test Data', () => {
      cy.prepareData('audio/sample.mp3', 1, ASSET_ID)
    })
    it('Distribute audio', () => {
      cy.visit(`/asset/${ASSET_ID}`)
      cy.api_waitPageLoad('asset-edit')

      // Add to podcast
      cy.getCy('button-podcast').should('be.visible').click()
      cy.getCy('button-add-new-podcast-episode').should('be.visible').click()
      cy.getCy('field-choose-podcast').click()
      cy.waitSec(2)
      cy.get('.v-list-item').contains(DISTRIBUTION_DATA.PODCAST).click()
      cy.circleLoad()
      cy.get('textarea').eq(0).type(ASSET_DESCRIPTION)
      cy.getCy('button-add').should('be.visible').click()
      cy.alertMessage(ALERT_CREATE)

      // Change distribution category
      cy.getCy('button-distribution').click()
      cy.get('.mdi-pencil').click()
      cy.get('.mdi-menu-down').click()
      cy.get('.v-list-item').contains(DISTRIBUTION_DATA.CATEGORY).click()
      cy.getCy('button-confirm').click()

      // Distribution Audio to JW
      cy.getCy('add-new-distribution').click()
      cy.circleLoad()
      cy.get('textarea').eq(0).type(ASSET_TITLE)
      cy.get('textarea').eq(2).type(ASSET_DESCRIPTION)
      cy.get(':nth-child(3) > .v-col').type(DISTRIBUTION_DATA.AUTHOR)
      cy.get(':nth-child(4) > .v-col').type(DISTRIBUTION_DATA.KEYWORD)
      cy.get('.mdi-calendar').click()
      cy.get('.shortcut-buttons-flatpickr-buttons').click()
      cy.get('.v-btn').contains('Zrušiť').should('be.visible')
      cy.get('.v-card-actions > .bg-primary').click()
      cy.alertMessage(ALERT_CREATE)

      // Distribution Audio to Artemis
      cy.get('[value="artemis_podcast_cms"]').click()
      cy.circleLoad()
      cy.get('textarea').eq(0).type(ASSET_TITLE)
      cy.get('textarea').eq(2).type(ASSET_DESCRIPTION)
      cy.get('.v-card-text [data-cy="custom-field-authors"]').type(DISTRIBUTION_DATA.AUTHOR)
      cy.get('.v-card-text [data-cy="custom-field-keywords"]').type(DISTRIBUTION_DATA.KEYWORD)
      cy.get('[id^="switch-"]').eq(2).click()  // Zalozit clanok -> ON
      cy.get('.v-card-actions > .bg-primary').click()
      cy.alertMessage(ALERT_CREATE)
      cy.getCy('button-close').click()

      // Check status
      cy.get(':nth-child(1) > .text-body-2 > :nth-child(2) > .v-col > .v-chip > .v-chip__content', { timeout: 90000 })
        .should('include.text', 'Distribuovaný')
      cy.get(':nth-child(2) > .text-body-2 > :nth-child(2) > .v-col > .v-chip > .v-chip__content')
        .should('include.text', 'Distribuovaný')  // JW distribution

      // Logs core-dam check
      cy.visit('/log')
      cy.getCy('filter-value').first().click()
      cy.contains('.v-list-item', 'coreDam').click()
      cy.getCy('filter-submit').click()
      cy.get('.v-data-table__tbody > :nth-child(1) > :nth-child(3)').contains('INFO')
      cy.get('.v-data-table__tbody > :nth-child(1) > :nth-child(4)').contains('[Artemis] Distribute')
    })
    it('Delete Test data', ()=>{
      cy.deleteFile(ASSET_ID)
    })
})
