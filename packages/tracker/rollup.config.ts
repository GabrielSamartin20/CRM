import type { RollupOptions } from 'rollup';

const config: RollupOptions = {
  input: 'src/index.ts',
  output: {
    file: 'dist/crm-tracker.umd.js',
    format: 'umd',
    name: 'CRMTracker'
  }
};

export default config;
