import { expect, test } from 'vitest';
import { registryNew } from '../src/main';
import { PluginRegistry } from '@studiorack/core';

const PLUGIN_REGISTRY: PluginRegistry = {
  name: `StudioRack Registry - registry`,
  url: `https://studiorack.github.io/studiorack-registry/v3/registry.json`,
  version: '1.2.3',
  objects: {},
};

test('Create a new registry', () => {
  const registry: PluginRegistry = registryNew('registry', '1.2.3', 'v3/');
  expect(registry).toEqual(PLUGIN_REGISTRY);
});
