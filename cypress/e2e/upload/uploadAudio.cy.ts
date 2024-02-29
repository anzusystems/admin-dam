/// <reference types="cypress" />

import { AUDIO_TYPES, UPLOAD_TYPES } from '../../utils/upload'
import { ALERT_UPLOAD, CY } from '../../utils/common'
const fileIDs: Array<string> = []

describe(`Test upload of various audio, Env: ${CY.cfg}`,
  { tags: ['@audioUpload', '@upload'] }, () => {
  AUDIO_TYPES.forEach((fileType) => {
    UPLOAD_TYPES.forEach((uploadType) => {
      it(`Audio: Upload ${fileType.toUpperCase()} - ${uploadType.toUpperCase()}`, () => {
        cy.prepareData(`audio/sample.${fileType}`,false)
        cy.uploadFile(`audio/sample.${fileType}`, uploadType)
        cy.api_getFileID().then((responseID) => {
          fileIDs.push(responseID)
          cy.waitForUpload(ALERT_UPLOAD, 20000)
          cy.verifyFileType(responseID, 'audio', fileType)
        })
      })
    })
  })
  it('Audio: Delete', { env: { visitBaseUrl: false } }, () => {
    cy.deleteFile(fileIDs)
  })
})
