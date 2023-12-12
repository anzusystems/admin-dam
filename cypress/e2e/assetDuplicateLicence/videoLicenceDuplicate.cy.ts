/// <reference types="cypress" />

import { CY } from '../../utils/common'
import { VIDEO_TYPES } from '../../utils/upload'
const FILE_ID: Array<string> = []
const TESTED_LICENCE_IDS = {
  CMS_MAIN: 100000,
  CMS_SPECTATOR: 100001,
} as const
describe(`Test asset video licence duplicate function, Env: ${CY.cfg}`,
  { tags: ['@assetVideoLicence', '@licence'], env: { visitBaseUrl: false } }, () => {
    it('Prepare Test Data', ()=> {
      cy.prepareData('video/sample.mp4', 0)
      cy.prepareData('video/sample.mov', 0)
    })
    it('Cms-system 1', () => {
      cy.visit('/asset')
      cy.api_waitPageLoad('main', TESTED_LICENCE_IDS.CMS_MAIN)
      let idx = 0
      VIDEO_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('video', dataFormat, idx, FILE_ID)
        cy.finishUpload()
        idx++
      })
    })
    it('CMS-system 2',()=>{
      cy.visit('/asset')
      cy.api_waitPageLoad('main', TESTED_LICENCE_IDS.CMS_MAIN)
      cy.changeLicence(TESTED_LICENCE_IDS.CMS_SPECTATOR)
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
      cy.api_waitPageLoad('main', TESTED_LICENCE_IDS.CMS_SPECTATOR)
      cy.changeLicence(TESTED_LICENCE_IDS.CMS_MAIN)
    })
  })
