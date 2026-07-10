declare module '*.svg' {
  const src: string;
  export default src;
}
declare module '*.png' {
  const src: string;
  export default src;
}
declare module '*.json' {
  const value: Record<string, { x: number; y: number; w: number; h: number }>;
  export default value;
}
