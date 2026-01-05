# InStep Testing Guide

This project maintains a comprehensive testing strategy involving unit tests, flow scenarios, and automated CI.

## Running Tests

### Unit & Flow Tests
Run the full suite using Jest:
```bash
npx jest
```

Run specific flow tests:
```bash
npx jest src/__tests__/flows/
```

Run with coverage:
```bash
npx jest --coverage
```

## Test Structure

- `src/__tests__/`: Contains all test files.
    - `flows/`: "Fake Manual" scenario tests that simulate user journeys using a stateful mock backend.
- `src/test/utils/`: Test helpers and mocks.
    - `mockFirestore.ts`: An in-memory database simulation to allow testing writes/reads without a real backend.
- `src/test/fixtures/`: Factories for creating test data (Users, Goals, Groups with valid shapes).

## Writing New Tests

### Unit Tests
For pure logic (utils, helpers), write standard Jest tests. Mock dependencies where needed.

### Flow Tests (Integration)
To test a feature e.g., "Deleting a Post":
1. Create a file `src/__tests__/flows/post_deletion.test.ts`.
2. Import `mockFirestore` and `reset()` it in `beforeEach`.
3. Seed data using `mockFirestore.set('path/to/doc', { ... })`.
4. Call your service methods.
5. Verify state changes using `mockFirestore.get(...)`.

## CI/CD initialization

GitHub Actions is configured in `.github/workflows/test.yml`.
It runs:
- On every PR
- On merge to `main`
- Nightly

Coverage reports are uploaded as artifacts.
