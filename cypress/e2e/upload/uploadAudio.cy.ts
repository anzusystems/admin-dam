/// <reference types="cypress" />

import { AUDIO_TYPES, UPLOAD_TYPES } from '../../utils/upload'
import { ALERT_UPLOAD, CY } from '../../utils/common'
const FILE_ID: Array<string> = []

describe(`Test upload of various audio, Env: ${CY.cfg}`, { tags: '@audio' }, () => {
  AUDIO_TYPES.forEach((fileType) => {
    UPLOAD_TYPES.forEach((uploadType) => {
      it(`Audio: Upload ${fileType.toUpperCase()} - ${uploadType.toUpperCase()}`, () => {
        cy.uploadFile(`audio/sample.${fileType}`, uploadType, 20000)
        cy.api_getFileID(20000).then((responseID) => {
          FILE_ID.push(responseID)
          cy.waitForUpload(ALERT_UPLOAD, 20000)
          cy.verifyFileType(responseID, 'audio', fileType)
        })
      })
    })
  })
  it('Audio: Delete', { env: { visitBaseUrl: false } }, () => {
    cy.deleteFile(FILE_ID)
  })
})
