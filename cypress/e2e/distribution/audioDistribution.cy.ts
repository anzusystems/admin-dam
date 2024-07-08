/// <reference types="cypress" />

import {
  CY,
  ASSET_TITLE,
  ASSET_DESCRIPTION,
  ALERT_CREATE
} from '../../utils/common'
const assetIDs: Array<string> = []
const DISTRIBUTION_DATA={
  PODCAST: 'Dobré ráno',
  CATEGORY: 'Podcasty',
  AUTHOR: 'Pavol Demeš',
  KEYWORD: 'Aupark',
} as const
describe(`Test distribution Audio function, Env: ${CY.cfg}`,
  { tags: ['@distributionAudio', '@distribution'] }, () => {
    if (CY.cfg !== 'stg' && CY.cfg !== 'dev'){
      it('Tests skipped - only possible in stg/dev env', ()=>{})
      return
    }
    beforeEach(() => {
      cy.webLogin(CY.credentials[CY.loginUser].username, CY.credentials[CY.loginUser].password)
    })
    it('Prepare Test Data', () => {
      cy.prepareData('audio/sample.mp3', 1, assetIDs)
    })
    it('Distribute audio', () => {
      cy.visit(`/asset/${assetIDs}`)
      cy.api_waitPageLoad('asset-edit')

      // Add to podcast
      cy.getCy('button-podcast').should('be.visible').click()
      cy.getCy('button-add-new-podcast-episode').should('be.visible').click()
      cy.getCy('field-choose-podcast').click()
      cy.waitSec(2)
      cy.getCy('field-choose-podcast').type(DISTRIBUTION_DATA.PODCAST)
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
      cy.get('.a-datetime-picker__now-button').click()
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
      cy.contains('.v-data-table__tr', '[Artemis] Distribute')
        .within(()=>{
          cy.contains('INFO')
        })
    })
    it('Verify artemis', ()=>{
      cy.visit(`${CY.url.proto}://artemis.${CY.url.domain}/admin/media/list/section/117`)
      cy.get('tbody > :nth-child(1) > :nth-child(8)').contains(ASSET_TITLE)
      cy.get(':nth-child(1) > .sonata-ba-list-field-actions > .btn-group > .btn').click()
      cy.get('#s452f557d4c_title').invoke('val').should('eq', ASSET_TITLE)
    })
    it('Delete Test data', ()=>{
      cy.deleteFile(assetIDs)
    })
})
