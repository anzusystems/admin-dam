/// <reference types="cypress" />

import { DOCUMENT_TYPES, UPLOAD_TYPES } from '../../utils/upload'
import { ALERT_UPLOAD, CY } from '../../utils/common'
const FILE_ID: Array<string> = []

describe(`Test upload of various audio, Env: ${CY.cfg}`, { tags: '@audio' }, () => {
  DOCUMENT_TYPES.forEach((fileType) => {
    UPLOAD_TYPES.forEach((uploadType) => {
      it(`Audio: Upload ${fileType.toUpperCase()} - ${uploadType.toUpperCase()}`, () => {
        cy.prepareData(`document/sample.${fileType}`,0)
        cy.uploadFile(`document/sample.${fileType}`, uploadType)
        cy.api_getFileID().then((responseID) => {
          FILE_ID.push(responseID)
          cy.waitForUpload(ALERT_UPLOAD, 20000)
          cy.verifyFileType(responseID, 'application', fileType)
        })
      })
    })
  })
  it('Audio: Delete', { env: { visitBaseUrl: false } }, () => {
    cy.deleteFile(FILE_ID)
  })
})
