/** Stub for @xverse/connect when the real package is not installed.
 * Provides a placeholder XverseConnectModal that throws on use,
 * falling back to window.xverse if available.
 */
export default class XverseConnectModal {
  constructor() {
    console.warn('XverseConnectModal stub loaded; install @xverse/connect to enable functionality.');
  }
  async connect() {
    throw new Error('XverseConnectModal stub: install @xverse/connect to enable connect');
  }
}