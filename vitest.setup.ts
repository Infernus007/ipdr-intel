import '@testing-library/jest-dom';
import React from 'react';

// Make React available globally for JSX
// @ts-ignore
global.React = React;

// Polyfill TextEncoder/TextDecoder for Node if needed
import { TextEncoder, TextDecoder } from 'util';
// @ts-ignore
global.TextEncoder = TextEncoder;
// @ts-ignore
global.TextDecoder = TextDecoder as any;


