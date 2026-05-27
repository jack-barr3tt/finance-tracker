/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string
  readonly VITE_ENABLE_SIGNUP: string
  readonly VITE_AUTO_LOGIN_EMAIL: string
  readonly VITE_AUTO_LOGIN_PASSWORD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
