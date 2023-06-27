/// <reference types="cypress" />

import { CY } from '../utils/common'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      api_getFile(id: string, failOnStatusCode?: boolean): Chainable<any>
      api_getFileID(timeout?: number): Chainable<string>
      api_getFileType(id: string): Chainable<string>
      api_deleteFile(id: string): Chainable<any>
    }
  }
}

const CORE_DAM_ASSET = (id?: string) => `${CY.url.proto}://core-dam.${CY.url.domain}/api/adm/v1/asset/${id}`
Cypress.Commands.add('api_getFileID', (timeout?: number) => {
  cy.intercept('GET', CORE_DAM_ASSET('*')).as('uploadApi')
  cy.wait('@uploadApi', { timeout: timeout | 10000 }).then((data) => {
    return cy.wrap(data.response.body.id)
  })
})

Cypress.Commands.add('api_deleteFile', (id: string) => {
  cy.request('DELETE', CORE_DAM_ASSET(id))
})

Cypress.Commands.add('api_getFile', (id: string, failOnStatusCode?: boolean) => {
  cy.request({
    url: CORE_DAM_ASSET(id),
    failOnStatusCode: failOnStatusCode,
  })
})

Cypress.Commands.add('api_getFileType', (id: string) => {
  cy.request({
    url: CORE_DAM_ASSET(id),
  }).then((response) => {
    return cy.wrap(response.body.mainFile.fileAttributes.mimeType)
  })
})

export {}
