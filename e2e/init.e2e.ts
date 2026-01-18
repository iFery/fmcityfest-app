/**
 * E2E Test: App initialization scenarios
 * Tests core offline-first bootstrap behavior
 */

import { by, device, element, expect as detoxExpect, waitFor } from 'detox';

describe('App Initialization', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Offline first launch blocked', () => {
    it('should show offline-blocked screen when offline and no cache', async () => {
      // Simulate offline state
      await device.setNetworkConnection('NONE');

      // Wait for bootstrap to complete
      await waitFor(element(by.text('Jste offline')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify offline-blocked screen elements
      await detoxExpect(element(by.text('Jste offline'))).toBeVisible();
      await detoxExpect(element(by.text('Zkusit znovu'))).toBeVisible();
      await detoxExpect(
        element(by.text('Otevřít nastavení připojení'))
      ).toBeVisible();
    });
  });

  describe('Online first launch success', () => {
    it('should load app successfully when online', async () => {
      // Simulate online state
      await device.setNetworkConnection('WIFI');

      // Wait for app to load (should not show offline-blocked screen)
      await waitFor(element(by.id('app-navigator')))
        .toBeVisible()
        .withTimeout(10000);

      // Verify app loaded (check for any app content)
      // Note: Adjust selector based on your actual app structure
      await detoxExpect(element(by.id('app-navigator'))).toBeVisible();
    });
  });

  describe('Offline with cached data works', () => {
    it('should show app content when offline but cache exists', async () => {
      // First, load app online to create cache
      await device.setNetworkConnection('WIFI');
      await waitFor(element(by.id('app-navigator')))
        .toBeVisible()
        .withTimeout(10000);

      // Now go offline
      await device.setNetworkConnection('NONE');
      await device.reloadReactNative();

      // App should still work with cached data
      await waitFor(element(by.id('app-navigator')))
        .toBeVisible()
        .withTimeout(5000);

      // Should NOT show offline-blocked screen
      await detoxExpect(element(by.text('Jste offline'))).not.toBeVisible();
    });
  });
});





