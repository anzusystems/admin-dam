/// <reference types="cypress" />

import { CY } from '../../utils/common'
import { DOCUMENT_TYPES } from '../../utils/upload'
const fileIDs: Array<string> = []
const TESTED_LICENCE_IDS = {
  CMS_MAIN: 100000,
  CMS_SPECTATOR: 100001,
} as const
describe(`Test asset document licence duplicate function, Env: ${CY.cfg}`,
  { tags: ['@assetDocLicence', '@licence'], env: { visitBaseUrl: false } }, () => {
    it('Prepare Test Data', ()=> {
      cy.prepareData('document/sample.doc', 0)
      cy.prepareData('document/sample.pdf', 0)
      cy.prepareData('document/sample.txt', 0)
      cy.prepareData('document/sample.xls', 0)
    })
  it('Cms-system 1', () => {
      cy.visit('/asset')
      cy.api_waitPageLoad('main', TESTED_LICENCE_IDS.CMS_MAIN)

      let idx = 0
      DOCUMENT_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('document', dataFormat, idx, fileIDs)
        cy.finishUpload()
        idx++
      })
    })
    it('CMS-system 2',()=>{
      cy.visit('/asset')
      cy.api_waitPageLoad('main', TESTED_LICENCE_IDS.CMS_MAIN)
      cy.changeLicence(TESTED_LICENCE_IDS.CMS_SPECTATOR)

      let idx = 0
      DOCUMENT_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('document', dataFormat, idx, fileIDs)
        cy.finishUpload()
        idx++
      })
    })
    it('Delete uploaded audios', ()=>{
      cy.deleteFile(fileIDs)
    })
    it('Back to main cms licence', ()=>{
      cy.visit('/asset')
      cy.api_waitPageLoad('main', TESTED_LICENCE_IDS.CMS_SPECTATOR)
      cy.changeLicence(TESTED_LICENCE_IDS.CMS_MAIN)
    })
  })
