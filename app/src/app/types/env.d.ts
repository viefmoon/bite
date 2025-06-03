declare module "@env" {
  export const API_URL: string;
  export const API_KEY: string;
  export const ENVIRONMENT: "development" | "staging" | "production";
  export const VERSION: string;
  export const BUILD_NUMBER: string;
}
