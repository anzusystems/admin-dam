/// <reference types="cypress" />

import { DOCUMENT_TYPES, UPLOAD_TYPES } from '../../utils/upload'
import { ALERT_UPLOAD, CY } from '../../utils/common'
const fileIDs: Array<string> = []

describe(`Test upload of various documents, Env: ${CY.cfg}`,
  { tags: ['@documentUpload', '@upload'] }, () => {
  DOCUMENT_TYPES.forEach((fileType) => {
    UPLOAD_TYPES.forEach((uploadType) => {
      it(`Document: Upload ${fileType.toUpperCase()} - ${uploadType.toUpperCase()}`, () => {
        cy.prepareData(`document/sample.${fileType}`,false)
        cy.uploadFile(`document/sample.${fileType}`, uploadType)
        cy.api_getFileID().then((responseID) => {
          fileIDs.push(responseID)
          cy.waitForUpload(ALERT_UPLOAD, 20000)
          cy.verifyFileType(responseID, 'application', fileType)
        })
      })
    })
  })
  it('Audio: Delete', { env: { visitBaseUrl: false } }, () => {
    cy.deleteFile(fileIDs)
  })
})

