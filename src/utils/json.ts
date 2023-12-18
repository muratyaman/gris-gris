export function jsonStringify(v: any): string {
  return JSON.stringify(v);
}

export function jsonParse<T = any>(v: string): T {
  return JSON.parse(v) as T; // pretending to be T
}
