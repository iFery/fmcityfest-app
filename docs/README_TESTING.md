# Testing Guide

This document describes the test suite for the fmcityfest-app.

## Test Structure

The test suite is organized into three levels:

1. **Unit Tests** - Test bootstrap logic in isolation
2. **Integration Tests** - Test BootstrapProvider + App UI interactions
3. **E2E Tests** - Test complete user journeys with Detox

## Running Tests

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage
```bash
npm run test:coverage
```

### E2E Tests

#### Build E2E app
```bash
npm run test:e2e:build
```

#### Run E2E tests
```bash
npm run test:e2e
```

## Test Scenarios

### Unit Tests

The unit tests cover 4 core bootstrap scenarios:

1. **online + fresh fetch => ready-online**
   - App is online, fetches data successfully, transitions to ready-online

2. **online + fetch error + cache exists => ready-offline**
   - App is online, fetch fails, but cache exists, transitions to ready-offline

3. **offline + cache exists => ready-offline**
   - App is offline, cache exists, transitions to ready-offline

4. **offline + no cache => offline-blocked**
   - App is offline, no cache, transitions to offline-blocked

### Integration Tests

Integration tests verify:
- Offline-blocked screen renders correctly
- Ready-offline screen shows app content
- Loader → app flow works correctly
- Retry functionality works in UI

### E2E Tests

E2E tests cover minimal user journeys:
- Offline first launch blocked
- Online first launch success
- Offline with cached data works

## CI/CD

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

The CI workflow:
1. Runs unit and integration tests
2. Generates coverage reports
3. Optionally runs E2E tests (can be skipped if device farm unavailable)

## Best Practices

- **Mock external dependencies** in unit/integration tests
- **Don't aim for 100% coverage** - focus on behavior
- **Keep unit tests fast and reliable**
- **Use meaningful selectors**, not implementation details
- **Tests should be deterministic** - no flaky tests

## Troubleshooting

### Tests failing with "Cannot find module"
- Run `npm install` to ensure all dependencies are installed
- Check that `@types/jest` is installed

### E2E tests failing
- Ensure app is built: `npm run test:e2e:build`
- Check Detox configuration matches your setup
- Verify emulator/simulator is running

### Integration tests timing out
- Increase timeout in test file if needed
- Check that mocks are properly configured
- Verify async operations complete




