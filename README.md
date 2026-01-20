# OSMOS Product Web Automation - Playwright

This is an automated testing framework built with Playwright for the OSMOS product.

## Project Structure

```
├── tests/          # Test specifications
├── pages/          # Page Object Model classes
├── utils/          # Utility functions and helpers
├── fixtures/       # Test fixtures
├── test-data/      # Test data files
├── reports/        # Test execution reports
├── screenshots/    # Screenshots on failure
├── logs/           # Execution logs
└── scripts/        # Custom scripts
```

## Installation

```bash
npm install
npx playwright install
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in headed mode
npm run test:headed

# Run smoke tests
npm run test:smoke

# Run regression tests
npm run test:regression

# Debug tests
npm run test:debug

# View test report
npm run report
```

## Environment Configuration

Copy `.env.example` to `.env` and configure your environment variables.

## Contributing

Please follow the coding standards and ensure all tests pass before submitting a pull request.
