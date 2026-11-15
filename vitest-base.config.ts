import { defineConfig } from 'vitest/config';

const GLOB_SYMBOLS = /[()[\]{}]/g;

export default defineConfig({
  plugins: [
    {
      name: 'escape-test-file-paths',
      config(config) {
        const test = config.test;
        if (test?.include) {
          test.include = test.include.map((path) => path.replace(GLOB_SYMBOLS, '\\$&'));
        }
      },
    },
  ],
});
