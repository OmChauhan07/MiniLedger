// Purpose: Configures Vitest test runner for backend integration and unit tests.
// Imported by: none (Vitest configuration file)

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
});
