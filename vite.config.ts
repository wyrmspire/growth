/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

const aliases = {
    '@core': resolve(__dirname, 'modules/core/src'),
    '@funnel': resolve(__dirname, 'modules/funnel/src'),
    '@strategy': resolve(__dirname, 'modules/strategy/src'),
    '@copylab': resolve(__dirname, 'modules/copylab/src'),
    '@approvals': resolve(__dirname, 'modules/approvals/src'),
    '@adapters': resolve(__dirname, 'modules/adapters/src'),
    '@publishing': resolve(__dirname, 'modules/publishing/src'),
    '@comments': resolve(__dirname, 'modules/comments/src'),
    '@analytics': resolve(__dirname, 'modules/analytics/src'),
};

export default defineConfig({
    resolve: { alias: aliases },
    server: {
        proxy: {
            '/api': 'http://localhost:3400',
        },
    },
    test: {
        globals: true,
        environment: 'node',
    },
});
