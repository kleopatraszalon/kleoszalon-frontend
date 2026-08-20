// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// React Router v7 relies on the Web Encoding API. Browsers provide these
// globals natively, while the legacy CRA/Jest jsdom runtime does not.
if (typeof global.TextEncoder === 'undefined') {
  Object.defineProperty(global, 'TextEncoder', {
    configurable: true,
    writable: true,
    value: TextEncoder,
  });
}

if (typeof global.TextDecoder === 'undefined') {
  Object.defineProperty(global, 'TextDecoder', {
    configurable: true,
    writable: true,
    value: TextDecoder,
  });
}
