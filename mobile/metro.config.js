// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Limit worker threads to prevent Node v24 V8 semi-space / zone memory exhaustion on multi-core Windows
config.maxWorkers = 2;

module.exports = config;
