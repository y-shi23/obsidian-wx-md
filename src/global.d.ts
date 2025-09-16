declare module 'front-matter' {
  interface FMResult<T> { attributes: T; body: string }
  function fm<T = Record<string, unknown>>(input: string): FMResult<T>
  export default fm
}
declare module 'reading-time' {
  export interface ReadTimeResults { text: string; minutes: number; time: number; words: number }
  function readingTime(text: string): ReadTimeResults
  export default readingTime
}
declare module 'isomorphic-dompurify' {
  interface SanitizeConfig { ADD_TAGS?: string[] }
  interface DOMPurifyI { sanitize(html: string, cfg?: SanitizeConfig): string }
  const DOMPurify: DOMPurifyI
  export default DOMPurify
}
declare module 'marked' {
  export interface RendererObject { [k: string]: unknown }
  export function parse(src: string): string
  export const marked: { parse: (s: string) => string }
}
declare module 'highlight.js' {
  interface HLJSStatic { highlight(code: string, opts: { language: string }): { value: string }; getLanguage(lang: string): boolean }
  const hljs: HLJSStatic
  export default hljs
}
declare module 'es-toolkit' {
  export function cloneDeep<T>(v: T): T
  export function toMerged<T extends object, U extends object>(a: T, b: U): T & U
}