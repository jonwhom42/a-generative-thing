/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Note: VITE_GEMINI_API_KEY removed - now handled server-side only
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
