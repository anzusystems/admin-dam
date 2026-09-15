/// <reference types="cypress" />

import { CY } from '../utils/common'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      uploadFile(fileName: string, action: 'select' | 'drag-drop', timeout?: number): Chainable<any>

      waitForUpload(alertUpload: string, timeout?: number): Chainable<any>
      verifyFileType(
        fileID: string,
        fileGroup: 'image' | 'audio' | 'video' | 'application',
        fileType: string
      ): Chainable<any>

      deleteFile(fileID: Array<string>): Chainable<any>

      cacheControl(file: string): Chainable<any>
    }
  }
}

Cypress.Commands.add('deleteFile', (fileID: Array<string>) => {
  fileID.forEach((id) => {
    cy.api_deleteFile(id).then((response) => {
      expect(response.status).to.eq(204)
    })
  })
})
Cypress.Commands.add(
  'verifyFileType',
  (fileID: string, fileGroup: 'image' | 'audio' | 'video' | 'application', fileType: string) => {
    const getFileType = (fileType: string): string => {
      if (fileType.includes('mp3')) return 'mpeg'
      else if (fileType.includes('mov')) return 'quicktime'
      else if (fileType.includes('wav')) return 'x-wav'
      else if (fileType.includes('doc')) return 'msword'
      else if (fileType.includes('xls')) return 'vnd.ms-excel'
      else if (fileType.includes('txt')) return 'plain'
      else return fileType
    }
    cy.api_getFileType(fileID).then((type) => {
      const expectedGroup = fileType.includes('txt') ? 'text' : fileGroup
      expect(type).to.contain(expectedGroup).and.to.contain(getFileType(fileType))
    })
  }
)
Cypress.Commands.add('waitForUpload', (alertUpload: string, timeout: number = 90000) => {
  cy.contains('[data-cy="upload-overlay-title"]', alertUpload, { timeout })
})
Cypress.Commands.add('uploadFile', (fileName: string, action: 'select' | 'drag-drop', timeout: number = 10000) => {
  cy.get('input[type="file"]', { timeout })
    .first()
    .selectFile(
      {
        contents: `fixtures/${fileName}`,
        mimeType: fileName.includes('wav') ? 'audio/wav' : undefined,
      },
      {
        waitForAnimations: true,
        force: true,
        action: action,
      }
    )
})

// A header can be a string or a list of them, and a response missing the directive fails the
// test rather than parsing `null`.
const maxAge = (header: string | string[] | undefined, name: string): number => {
  const match = /max-age=(\d+)/.exec(String(header))
  if (match === null) throw new Error(`${name} carries no max-age: ${header}`)
  return Number.parseInt(match[1], 10)
}

Cypress.Commands.add('cacheControl', (file: string) => {
  cy.request({
    method: 'GET',
    url: `${CY.url.proto}://imageadmin.smedatastaging.sk/image/${file}`,
  }).then((response) => {
    // cache-control, max-age = 0
    const CACHE_MAX_AGE = maxAge(response.headers['cache-control'], 'cache-control')
    expect(CACHE_MAX_AGE).to.be.eq(0)

    // cache-control - public
    expect(response.headers['cache-control']).to.include('public')

    // strict-transport-security, max-age > 0
    const SECURE_MAX_AGE = maxAge(response.headers['strict-transport-security'], 'strict-transport-security')
    expect(SECURE_MAX_AGE).to.be.gte(0)
  })

  cy.request({
    method: 'GET',
    url: `${CY.url.proto}://image.smedatastaging.sk/image/w200-h200/${file.split('/')[1]}`,
  }).then((response) => {
    // cache-control, max-age > 0
    const CACHE_MAX_AGE = maxAge(response.headers['cache-control'], 'cache-control')
    expect(CACHE_MAX_AGE).to.be.gte(0)

    // cache-control - public
    expect(response.headers['cache-control']).to.include('public')

    // strict-transport-security, max-age > 0
    const SECURE_MAX_AGE = maxAge(response.headers['strict-transport-security'], 'strict-transport-security')
    expect(SECURE_MAX_AGE).to.be.gte(0)
  })
})
