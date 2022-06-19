export function jsonStringify(v: any): string {
  try {
    return JSON.stringify(v);
  } catch (err) {
    console.warn('error on JSON.stringify()', err);
    return '';
  }
}
