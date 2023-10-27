/// <reference types="cypress" />

import { CY } from '../../utils/common'
import { VIDEO_TYPES } from '../../utils/upload'
const FILE_ID: Array<string> = []
const main_licence = '100000'
const cms32630_licence = '200010'
describe(`Test asset video licence duplicate function, Env: ${CY.cfg}`,
  { tags: '@assetVideoLicence', env: { visitBaseUrl: false } }, () => {
    it('Prepare Test Data', ()=> {
      cy.prepareData('video/sample.mp4', 0)
      cy.prepareData('video/sample.mov', 0)
    })
    it('Cms-sys | CMS licence', () => {
      cy.visit('/asset')
      cy.api_waitPageLoad('main', main_licence)
      let idx = 0
      VIDEO_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('video', dataFormat, idx, FILE_ID)
        cy.finishUpload()
        idx++
      })
    })
    it('CMS-sys | cms32630',()=>{
      cy.visit('/asset')
      cy.api_waitPageLoad('main', main_licence)
      cy.changeLicence(cms32630_licence)
      let idx = 0
      VIDEO_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('video', dataFormat, idx, FILE_ID)
        cy.finishUpload()
        idx++
      })
    })
    it('Delete uploaded videos', ()=>{
      cy.deleteFile(FILE_ID)
    })
    it('Back to main cms licence', ()=>{
      cy.visit('/asset')
      cy.api_waitPageLoad('main', cms32630_licence)
      cy.changeLicence(main_licence)
    })
  })
