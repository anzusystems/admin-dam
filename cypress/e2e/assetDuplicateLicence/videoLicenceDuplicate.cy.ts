/// <reference types="cypress" />

import { CY } from '../../utils/common'
import { VIDEO_TYPES } from '../../utils/upload'
let idLicence = ''
const FILE_ID: Array<string> = []

describe(`Test asset video licence duplicate function, Env: ${CY.cfg}`,
  { tags: '@assetVideoLicence', env: { visitBaseUrl: false } }, () => {
    it('Prepare Test Data', ()=> {
      cy.prepareData('video/sample.mp4', 0)
      cy.prepareData('video/sample.mov', 0)
    })
    it('Cms-sys | CMS licence', () => {
      cy.visit('/asset')
      cy.api_waitPageLoad('licence-unknown')
      idLicence = '100000'
      cy.getCy('button-manage-licence', 6000).should('be.visible')
        .invoke('text')
        .then((text)=>{
          const actualLicence = text.trim()
          if (actualLicence !== 'CMS licence'){
            cy.changeLicence('main', idLicence)
          }
        })
      let idx = 0
      VIDEO_TYPES.forEach((dataFormat)=>{
        cy.checkDuplicate('video', dataFormat, idx, FILE_ID)
        cy.finishUpload()
        idx++
      })
    })
    it('CMS-sys | cms32630',()=>{
      cy.visit('/asset')
      cy.api_waitPageLoad('main', idLicence)
      idLicence = '200010'  // cms32630
      cy.changeLicence(idLicence)
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
      cy.api_waitPageLoad('main', idLicence)
      idLicence = '100000'
      cy.changeLicence(idLicence)
    })
  })
