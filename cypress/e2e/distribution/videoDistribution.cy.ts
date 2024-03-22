/// <reference types="cypress" />

import {
  CY,
  ASSET_TITLE,
  ASSET_DESCRIPTION,
  ALERT_CREATE
} from '../../utils/common'
const assetIDs: Array<string> = []
const DISTRIBUTION_DATA={
  CATEGORY: 'Publicistika',
  AUTHOR: 'Boris Zemko',
  KEYWORD: 'Aupark',
} as const

describe(`Test distribution Video function, Env: ${CY.cfg}`,
  { tags: ['@distributionVideo', '@distribution'] }, () => {
    if (CY.cfg !== 'stg' && CY.cfg !== 'dev'){
      it('Tests skipped - only possible in stg/dev env', ()=>{})
      return
    }
    beforeEach(() => {
      cy.webLogin(CY.credentials[CY.loginUser].username, CY.credentials[CY.loginUser].password)
    })
    it('Prepare Test Data', () => {
      cy.prepareData('video/sample.mp4', 1, assetIDs)
    })
    it('Distribute video', () => {
      cy.visit(`/asset/${assetIDs}`)
      cy.api_waitPageLoad('asset-edit')

      // Change distribution category
      cy.getCy('button-distribution').click()
      cy.get('.mdi-pencil').click()
      cy.get('.mdi-menu-down').click()
      cy.get('.v-list-item').contains(DISTRIBUTION_DATA.CATEGORY).click()
      cy.getCy('button-confirm').click()

      // Distribution video to YT todo - until bug is fixed
      cy.getCy('add-new-distribution').click()
      // cy.circleLoad()
      // cy.get('textarea').eq(0).type(ASSET_TITLE)
      // cy.get('textarea').eq(2).type(ASSET_DESCRIPTION)
      // cy.get('.v-btn').contains('Zrušiť').should('be.visible')
      // cy.get('.v-card-actions > .bg-primary').click()
      // cy.alertMessage(ALERT_CREATE)

      // Distribution video to JW Video Player
      cy.get('[value="jw_cms"]').click()
      cy.circleLoad()
      cy.get('textarea').eq(0).type(ASSET_TITLE)
      cy.get('textarea').eq(2).type(ASSET_DESCRIPTION)
      cy.get(':nth-child(3) > .v-col > .v-input > .v-input__control > .v-field > .v-field__field > .v-field__input')
        .type(DISTRIBUTION_DATA.AUTHOR)
      cy.get('.v-card-actions > .bg-primary').click()
      cy.alertMessage(ALERT_CREATE)

      // Distribution Audio to Artemis
      cy.get('[value="artemis_video_cms"]').click()
      cy.circleLoad()
      cy.get('textarea').eq(0).type(ASSET_TITLE)
      cy.get('textarea').eq(2).type(ASSET_DESCRIPTION)
      cy.get('.v-card-text [data-cy="custom-field-authors"]').type(DISTRIBUTION_DATA.AUTHOR)
      cy.get('.v-card-text [data-cy="custom-field-keywords"]').type(DISTRIBUTION_DATA.KEYWORD)
      cy.get('[id^="switch-"]').eq(0).click()  // Zalozit clanok -> ON
      cy.get('.v-card-actions > .bg-primary').click()
      cy.alertMessage(ALERT_CREATE)
      cy.getCy('button-close').click()

      // Check status
      cy.get(':nth-child(1) > .text-body-2 > :nth-child(2) > .v-col > .v-chip > .v-chip__content', { timeout: 120000 })
        .should('include.text', 'Distribuovaný')  // Artemis Distribution
      cy.get(':nth-child(2) > .text-body-2 > :nth-child(2) > .v-col > .v-chip > .v-chip__content', { timeout: 20000 })
        .should('include.text', 'Distribuovaný')  // JW distribution
      // cy.get(':nth-child(3) > .text-body-2 > :nth-child(2) > .v-col > .v-chip > .v-chip__content') todo until fixed
      //   .should('include.text', 'Distribuovaný')  // YT distribution

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
      cy.visit(`${CY.url.proto}://artemis.${CY.url.domain}/admin/media/list/section/119`)
      cy.get('tbody > :nth-child(1) > :nth-child(8)').contains(ASSET_TITLE)
      cy.get(':nth-child(1) > .sonata-ba-list-field-actions > .btn-group > .btn').click()
      cy.get('.sonata-ba-field > .list-group > .list-group-item').click()
      cy.get('#sdc5d04ee76_title_baseTitle')
        .invoke('val').should('eq', ASSET_TITLE)
      cy.get('#s2id_sdc5d04ee76_tags_autocomplete_input > .select2-choices').contains(DISTRIBUTION_DATA.KEYWORD)
      cy.get('#s2id_sdc5d04ee76_authors_autocomplete_input > .select2-choices').contains(DISTRIBUTION_DATA.AUTHOR)
    })
    it('Delete Test data', ()=>{
      cy.deleteFile(assetIDs)
    })
  })
