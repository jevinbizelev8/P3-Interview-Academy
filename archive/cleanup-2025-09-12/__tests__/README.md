# Test Suite Documentation

This document provides information about the comprehensive test suite for the P³ Interview Academy prepare module.

## Overview

The test suite ensures that the prepare module loads correctly and performs as intended with user interactions. It includes unit tests, integration tests, and API tests.

## Test Structure

```
__tests__/
├── components/          # Unit tests for React components
│   ├── Home.test.tsx                 # Main prepare module page
│   ├── LanguageSelector.test.tsx     # ASEAN language selection
│   └── JobDescriptionUpload.test.tsx # File upload functionality
├── integration/         # Integration tests
│   └── PrepareModuleFlow.test.tsx    # Complete user flows
├── api/                # API integration tests
│   ├── SessionAPI.test.ts            # Session creation and management
│   └── JobDescriptionAPI.test.ts     # File upload/download APIs
├── utils/              # Test utilities and setup
│   ├── test-utils.tsx               # Custom render utilities
│   └── mocks/                       # Mock API handlers
│       ├── handlers.ts              # MSW request handlers
│       └── server.ts                # MSW server setup
├── setup.ts            # Global test setup
└── README.md           # This file
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests once
npm run test:run

# Run with UI interface
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Specific Test Categories

```bash
# Run only prepare module component tests
npm run test:prepare

# Run integration tests
npm run test:integration

# Run API tests
npm run test:api
```

## Test Categories

### 1. Unit Tests

#### Home Component (`Home.test.tsx`)
- ✅ Component rendering and form display
- ✅ Form validation (required fields)
- ✅ Auto-suggestion logic for interview stages
- ✅ Interview stage selection
- ✅ Session creation flow
- ✅ Error handling
- ✅ Loading states
- ✅ Accessibility compliance

#### LanguageSelector Component (`LanguageSelector.test.tsx`)
- ✅ ASEAN language display
- ✅ Language selection functionality
- ✅ Default language handling
- ✅ Keyboard navigation
- ✅ Error handling
- ✅ Data integrity validation

#### JobDescriptionUpload Component (`JobDescriptionUpload.test.tsx`)
- ✅ File upload functionality
- ✅ Drag and drop interface
- ✅ File validation (size, type)
- ✅ Existing file management
- ✅ Delete functionality
- ✅ Loading and error states
- ✅ API integration

### 2. Integration Tests

#### Prepare Module Flow (`PrepareModuleFlow.test.tsx`)
- ✅ Complete session setup flow
- ✅ Navigation between modules
- ✅ Technical role workflow with industry selection
- ✅ Job description upload integration
- ✅ Multi-language support
- ✅ Error recovery flows
- ✅ Mobile responsiveness
- ✅ Performance testing

### 3. API Tests

#### Session API (`SessionAPI.test.ts`)
- ✅ Dynamic scenario generation
- ✅ Session creation with proper data format
- ✅ Parameter validation
- ✅ Multi-language session support
- ✅ Error handling and recovery
- ✅ Performance testing
- ✅ Concurrent request handling

#### Job Description API (`JobDescriptionAPI.test.ts`)
- ✅ File upload (PDF, DOC, DOCX)
- ✅ File validation and size limits
- ✅ User file management
- ✅ Delete functionality
- ✅ Error scenarios
- ✅ Data consistency
- ✅ Concurrent operations

## Key Features Tested

### 1. Session Creation Fix
- ✅ Correct API endpoint (`/api/practice/sessions`)
- ✅ Proper data format transformation
- ✅ Dynamic scenario generation before session creation
- ✅ Error handling for API failures

### 2. User Interface
- ✅ Form validation and user feedback
- ✅ Interview stage auto-suggestion
- ✅ ASEAN language selection
- ✅ Job description upload with drag & drop
- ✅ Loading states and error messages

### 3. Accessibility
- ✅ Proper ARIA labels and roles
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ Focus management

### 4. Error Handling
- ✅ Network failures
- ✅ API validation errors  
- ✅ File upload errors
- ✅ User input validation
- ✅ Graceful degradation

## Mock Data

The test suite uses MSW (Mock Service Worker) to intercept and mock API requests:

- **Scenarios**: Dynamic interview scenarios based on job position and company
- **Sessions**: Mock session creation with proper response format
- **Job Descriptions**: File upload/download simulation with validation
- **Error Scenarios**: Various error conditions for testing edge cases

## Test Coverage Goals

- **Unit Tests**: 90%+ coverage on prepare module components
- **Integration Tests**: Complete user flows from form to session creation
- **API Tests**: All endpoints used by prepare module
- **Error Scenarios**: Network failures, validation errors, edge cases

## Continuous Integration

Tests run automatically on:
- ✅ Pull requests to main/develop branches
- ✅ Pushes to main/develop branches
- ✅ Multiple Node.js versions (18.x, 20.x)
- ✅ Coverage reporting
- ✅ Build verification

## Debugging Tests

### Common Issues

1. **MSW Handler Not Found**
   ```
   [MSW] Warning: intercepted a request without a matching request handler
   ```
   - Add appropriate handler in `utils/mocks/handlers.ts`

2. **Component Not Rendering**
   - Check if all providers are wrapped correctly in test-utils
   - Verify mock setup in test file

3. **Async Test Failures**
   - Use `waitFor()` for async operations
   - Check timeout settings in test configuration

### Debugging Commands

```bash
# Run specific test file
npx vitest run client/src/__tests__/components/Home.test.tsx

# Run tests with verbose output
npx vitest run --reporter=verbose

# Debug with UI
npm run test:ui
```

## Contributing

When adding new features to the prepare module:

1. **Add Unit Tests**: Test individual components
2. **Add Integration Tests**: Test complete user flows
3. **Add API Tests**: Test any new endpoints
4. **Update Mocks**: Add new mock handlers as needed
5. **Run Full Suite**: Ensure all tests pass before submitting

## Future Improvements

- [ ] Add E2E tests with Playwright
- [ ] Add visual regression testing
- [ ] Add performance benchmarks
- [ ] Add accessibility automated testing
- [ ] Add cross-browser testing