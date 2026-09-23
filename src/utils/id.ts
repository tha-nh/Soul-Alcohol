/**
 * RFC4122-ish v4 id. Good enough for local primary keys on a single device;
 * not used for anything security-sensitive (see speaker embeddings, which
 * never derive their identity from this).
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    /* eslint-disable no-bitwise */
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    /* eslint-enable no-bitwise */
    return value.toString(16);
  });
}
