# AGENTS.md - AI Agent Guidelines

This file provides essential context for AI coding agents operating in this repository.

## Project Overview

**Language**: [Primary language - e.g., TypeScript, Python, Go, Rust]  
**Framework**: [Main framework - e.g., Next.js, FastAPI, Express, Rails]  
**Package Manager**: [npm, pnpm, yarn, pip, cargo, go mod]

## Build & Development Commands

### Installation
```bash
# Install dependencies
[command here - e.g., npm install, pip install -r requirements.txt]
```

### Development
```bash
# Start dev server
[command here - e.g., npm run dev, python manage.py runserver]

# Build for production
[command here - e.g., npm run build, cargo build --release]

# Watch mode (if applicable)
[command here - e.g., npm run watch, make watch]
```

### Testing

```bash
# Run all tests
[command here - e.g., npm test, pytest, go test ./...]

# Run single test file
[command here - e.g., npm test path/to/test.test.ts, pytest tests/test_file.py]

# Run specific test
[command here - e.g., npm test -- -t "test name", pytest tests/test_file.py::test_function]

# Run tests in watch mode
[command here - e.g., npm test -- --watch, pytest-watch]

# Run tests with coverage
[command here - e.g., npm test -- --coverage, pytest --cov]
```

### Linting & Formatting

```bash
# Lint code
[command here - e.g., npm run lint, pylint src/, cargo clippy]

# Fix linting issues
[command here - e.g., npm run lint:fix, ruff check --fix]

# Format code
[command here - e.g., npm run format, black ., cargo fmt]

# Type check
[command here - e.g., npm run type-check, mypy src/, tsc --noEmit]
```

## Code Style Guidelines

### File Organization

```
[Describe project structure - e.g.,]
src/
  ├── components/     # React components
  ├── lib/           # Utility functions
  ├── types/         # TypeScript type definitions
  ├── api/           # API routes/handlers
  └── tests/         # Test files (co-located or separate)
```

### Import Order

[Specify import ordering conventions - e.g.,]
```typescript
// 1. External dependencies
import React from 'react'
import { useQuery } from '@tanstack/react-query'

// 2. Internal absolute imports
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'

// 3. Relative imports
import { helper } from './utils'

// 4. Type imports (if using TypeScript)
import type { User } from '@/types'
```

### Naming Conventions

- **Files**: [e.g., camelCase.ts, kebab-case.tsx, snake_case.py, PascalCase.tsx for components]
- **Functions**: [e.g., camelCase, snake_case]
- **Classes**: [e.g., PascalCase]
- **Constants**: [e.g., UPPER_SNAKE_CASE, SCREAMING_SNAKE_CASE]
- **Interfaces/Types**: [e.g., PascalCase, prefix with 'I' or not]
- **Private members**: [e.g., _prefixed, #private fields]

### Type Safety

**TypeScript Projects:**
- Never use `any` - prefer `unknown` if type is truly unknown
- Never use `@ts-ignore` or `@ts-expect-error` - fix the underlying type issue
- Use strict mode (`strict: true` in tsconfig.json)
- Prefer interfaces for object shapes, types for unions/intersections
- Use type guards for runtime type checking

**Python Projects:**
- Use type hints for all function signatures
- Use mypy or pyright for static type checking
- Prefer explicit types over implicit `Any`

**Other Languages:**
- [Language-specific type safety guidelines]

### Error Handling

[Define error handling patterns - e.g.,]
```typescript
// Async functions: throw errors, let caller handle
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.statusText}`)
  }
  return response.json()
}

// Use custom error classes for domain-specific errors
class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Never use empty catch blocks
try {
  await riskyOperation()
} catch (error) {
  logger.error('Operation failed', { error })
  throw error // Re-throw or handle appropriately
}
```

### Formatting

- **Indentation**: [2 spaces, 4 spaces, tabs]
- **Line Length**: [80, 100, 120 characters]
- **Quotes**: [single quotes, double quotes]
- **Semicolons**: [required, optional]
- **Trailing Commas**: [yes, no]
- **Arrow Functions**: [always use, prefer for callbacks]

## Testing Guidelines

### Test File Location
[e.g., Co-located: `component.tsx` + `component.test.tsx`, OR separate `tests/` directory]

### Test Structure
[Define preferred test structure - e.g.,]
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Arrange
    const props = { ... }
    
    // Act
    render(<Component {...props} />)
    
    // Assert
    expect(screen.getByText('...')).toBeInTheDocument()
  })
})
```

### Mocking Guidelines
[e.g., Use jest.mock() for modules, MSW for API calls, avoid excessive mocking]

### Coverage Expectations
[e.g., Minimum 80% coverage, focus on critical paths, skip trivial getters/setters]

## Git Workflow

### Commit Messages
[Define commit message format - e.g.,]
```
type(scope): brief description

- Longer explanation if needed
- Multiple lines OK

Types: feat, fix, docs, style, refactor, test, chore
```

### Branch Naming
[e.g., feature/description, fix/issue-number, chore/task]

### Pre-commit Hooks
[List hooks if configured - e.g., lint-staged, prettier, tests]

## Common Patterns

### State Management
[e.g., Use React Context for global state, Zustand for complex state, avoid prop drilling]

### API Calls
[e.g., Use React Query for data fetching, centralize API client in lib/api]

### Form Handling
[e.g., Use React Hook Form with Zod validation]

### Styling
[e.g., Tailwind CSS utility-first, CSS Modules for component styles, styled-components]

## Critical Constraints

### Hard Rules (NEVER violate)
- ❌ Never suppress type errors (`any`, `@ts-ignore`, `@ts-expect-error`)
- ❌ Never commit broken code (must pass linting and tests)
- ❌ Never use empty catch blocks
- ❌ Never delete tests to make them "pass"
- ❌ Never commit credentials, API keys, or secrets
- ✅ Always run tests before committing
- ✅ Always handle errors explicitly
- ✅ Always validate user input
- ✅ Always clean up resources (connections, listeners, intervals)

### Pre-existing Issues
If you encounter pre-existing lint errors or failing tests unrelated to your changes:
1. Fix your changes first
2. Report pre-existing issues separately
3. Don't mix fixes for old issues with new feature work

## Debugging & Troubleshooting

### Common Issues
[Document common problems and solutions]

### Logging
[Define logging patterns - e.g., use logger.info/error/debug, avoid console.log in production]

### Performance
[Key performance considerations for this project]

## Dependencies

### Adding Dependencies
[Process for adding new dependencies - e.g., discuss in PR, prefer stable versions]

### Updating Dependencies
[How to update - e.g., use dependabot, update one at a time, test thoroughly]

## Additional Resources

- [Link to architecture docs]
- [Link to API documentation]
- [Link to design system]
- [Link to deployment guide]

---

**Last Updated**: [Date]  
**Maintainer**: [Team/Person]
