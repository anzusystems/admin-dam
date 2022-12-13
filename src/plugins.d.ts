import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    layout?: string
    transition?: string
    public?: boolean
  }
}

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    RouterLink: typeof import('vue-router')['RouterLink']
    RouterView: typeof import('vue-router')['RouterView']
    Notifications: any // todo
  }
}
