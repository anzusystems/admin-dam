/// <reference types="cypress" />

import { CY } from '../../utils/common'
import { DOCUMENT_TYPES } from '../../utils/upload'
const FILE_ID: Array<string> = []
const main_licence = '100000'
const cms32630_licence = '200010'
describe(`Test asset document licence duplicate function, Env: ${CY.cfg}`,
  { tags: '@assetDocLicence', env: { visitBaseUrl: false } }, () => {
    it('Prepare Test Data', ()=> {
      cy.prepareData('document/sample.doc', 0)
      cy.prepareData('document/sample.pdf', 0)
      cy.prepareData('document/sample.txt', 0)
      cy.prepareData('document/sample.xls', 0)
    })
  it('Cms-sys | CMS licence', () => {
      cy.visit('/asset')
      cy.api_waitPageLoad('main', main_licence)

      let idx = 0
      DOCUMENT_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('document', dataFormat, idx, FILE_ID)
        cy.finishUpload()
        idx++
      })
    })
    it('CMS-sys | cms32630',()=>{
      cy.visit('/asset')
      cy.api_waitPageLoad('main', main_licence)
      cy.changeLicence(cms32630_licence)

      let idx = 0
      DOCUMENT_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('document', dataFormat, idx, FILE_ID)
        cy.finishUpload()
        idx++
      })
    })
    it('Delete uploaded audios', ()=>{
      cy.deleteFile(FILE_ID)
    })
    it('Back to main cms licence', ()=>{
      cy.visit('/asset')
      cy.api_waitPageLoad('main', cms32630_licence)
      cy.changeLicence(main_licence)
    })
  })
