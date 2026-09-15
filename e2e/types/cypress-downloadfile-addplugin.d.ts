// `cypress-downloadfile` declares types for its package root only. The node-side task lives in
// `lib/addPlugin.js`, which ships no declaration at all.
declare module 'cypress-downloadfile/lib/addPlugin.js' {
  export function downloadFile(args: {
    url: string
    directory: string
    fileName: string
    cookies: Array<{ name: string; value: string }>
    userAgent?: string
  }): Promise<string>
}
