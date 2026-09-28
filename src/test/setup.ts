import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';

beforeAll(() => {
  // jsdom n'implémente pas le défilement.
  window.scrollTo = () => undefined;
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.location.hash = '';
});
