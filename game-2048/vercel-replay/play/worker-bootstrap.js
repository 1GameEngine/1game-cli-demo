let bootstrapped = false;
let pendingExec = false;
let bundleUrl = '';
let bundleSource = '';
let objectBundleUrl = '';

if (typeof globalThis.self === 'undefined') {
  (globalThis).self = globalThis;
}

function revokeObjectBundleUrl() {
  if (!objectBundleUrl || typeof URL.revokeObjectURL !== 'function') return;
  try {
    URL.revokeObjectURL(objectBundleUrl);
  } catch {}
  objectBundleUrl = '';
}

function resolveBundleImportUrl() {
  if (bundleUrl) return bundleUrl;
  if (!bundleSource) return '';
  if (!objectBundleUrl) {
    const blob = new Blob([bundleSource], { type: 'text/javascript;charset=utf-8' });
    objectBundleUrl = URL.createObjectURL(blob);
  }
  return objectBundleUrl;
}

async function execBundle() {
  if (!bootstrapped || !pendingExec) return;
  const importUrl = resolveBundleImportUrl();
  if (!importUrl) return;
  pendingExec = false;
  try {
    await import(importUrl);
  } catch (err) {
    self.postMessage({ type: 'runtime_error', error: String(err) });
  }
}

self.addEventListener('message', async function onMessage(event) {
  const msg = event.data;
  if (msg?.type === 'init' && msg.port) {
    if (bootstrapped) return;
    bootstrapped = true;
    const port = msg.port;
    self.__ENGINE_PORT__ = port;
    port.start();
    await execBundle();
    return;
  }
  if (msg?.type === 'exec') {
    if (typeof msg.bundleSource === 'string' && msg.bundleSource) {
      bundleSource = msg.bundleSource;
      bundleUrl = '';
      revokeObjectBundleUrl();
    }
    if (typeof msg.bundleUrl === 'string' && msg.bundleUrl) {
      bundleUrl = msg.bundleUrl;
      bundleSource = '';
      revokeObjectBundleUrl();
    }
    pendingExec = true;
    await execBundle();
  }
});