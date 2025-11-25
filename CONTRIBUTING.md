# Contributing to OpenSearch MCP Server

Thank you for your interest in contributing to the OpenSearch MCP Server! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to a code of conduct that ensures a welcoming and inclusive environment for all contributors. By participating, you are expected to uphold this code.

### Our Standards

- **Be respectful:** Treat all community members with respect and kindness
- **Be inclusive:** Welcome newcomers and help them get started
- **Be collaborative:** Work together constructively and give helpful feedback
- **Be professional:** Keep discussions focused and constructive

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- Git for version control
- Access to an OpenSearch cluster for testing
- VS Code (recommended) with relevant extensions

### Development Setup

1. **Fork and Clone**
   ```bash
   # Fork the repository on GitHub
   # Clone your fork
   git clone https://github.com/YOUR_USERNAME/opensearch-mcp-server.git
   cd opensearch-mcp-server
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your OpenSearch cluster details
   ```

4. **Build and Test**
   ```bash
   npm run build
   npm test
   npm start
   ```

5. **Verify Setup**
   ```bash
   # Test basic functionality
   npm run test
   # Check linting
   npm run lint
   ```

## Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- **Bug Fixes:** Fix existing issues or bugs
- **Features:** Add new functionality or tools
- **Documentation:** Improve existing docs or add new guides
- **Tests:** Add or improve test coverage
- **Performance:** Optimize existing code
- **Security:** Address security vulnerabilities

### Before You Start

1. **Check Existing Issues:** Look for existing issues or discussions
2. **Create an Issue:** For significant changes, create an issue first
3. **Get Feedback:** Discuss your approach before implementation
4. **Stay Updated:** Keep your fork synchronized with the main repository

### Branch Strategy

- **main:** Stable production branch
- **develop:** Integration branch for new features
- **feature/\*:** Feature development branches
- **bugfix/\*:** Bug fix branches
- **hotfix/\*:** Critical production fixes

### Commit Messages

Follow conventional commit format:

```
type(scope): description

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(search): add support for scroll API
fix(client): handle connection timeout properly
docs(readme): update installation instructions
test(aggregation): add unit tests for date histogram
```

## Pull Request Process

### Creating a Pull Request

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow coding standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Thoroughly**
   ```bash
   npm run test
   npm run lint
   npm run build
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat(scope): your descriptive message"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create pull request on GitHub
   ```

### Pull Request Requirements

- [ ] Code follows project standards
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] No merge conflicts
- [ ] PR description explains changes
- [ ] Related issues are linked

### Review Process

1. **Automated Checks:** CI/CD pipeline runs tests
2. **Code Review:** Maintainers review code quality
3. **Testing:** Functionality testing in various environments
4. **Approval:** At least one maintainer approval required
5. **Merge:** Squash and merge to main branch

## Coding Standards

### TypeScript Guidelines

- Use TypeScript for all source code
- Enable strict type checking
- Prefer interfaces over type aliases for object shapes
- Use proper JSDoc comments for public APIs

```typescript
/**
 * Search for documents in OpenSearch
 * @param params - Search parameters
 * @returns Promise resolving to search results
 */
async function search(params: SearchRequest): Promise<SearchResponse> {
  // Implementation
}
```

### Code Style

- Use Prettier for code formatting
- Follow ESLint rules
- Use meaningful variable and function names
- Keep functions small and focused
- Prefer async/await over Promises

### File Organization

```
src/
├── index.ts              # Main server entry point
├── opensearch/           # OpenSearch client and utilities
│   ├── client.ts
│   └── utils.ts
├── types/                # Type definitions
│   ├── config.ts
│   └── opensearch.ts
└── tools/                # MCP tool implementations
    ├── search.ts
    ├── management.ts
    └── aggregation.ts
```

### Error Handling

- Use proper error types and messages
- Implement graceful error recovery
- Log errors appropriately
- Follow MCP error response format

```typescript
try {
  const result = await opensearch.search(params);
  return result;
} catch (error) {
  console.error('Search failed:', error);
  throw new McpError(
    ErrorCode.InternalError,
    `Search operation failed: ${error.message}`
  );
}
```

## Testing

### Test Structure

- **Unit Tests:** Test individual functions and classes
- **Integration Tests:** Test OpenSearch interactions
- **End-to-End Tests:** Test complete MCP workflows

### Writing Tests

```typescript
describe('OpenSearchClient', () => {
  describe('search', () => {
    it('should return search results', async () => {
      // Arrange
      const client = new OpenSearchClient(config);
      const params = { index: 'test', q: 'test query' };
      
      // Act
      const result = await client.search(params);
      
      // Assert
      expect(result.hits).toBeDefined();
      expect(result.hits.total.value).toBeGreaterThan(0);
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- search.test.ts

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

- Maintain >80% code coverage
- Focus on critical paths and error scenarios
- Mock external dependencies appropriately

## Documentation

### Types of Documentation

1. **Code Documentation:** JSDoc comments for all public APIs
2. **User Documentation:** README, guides, and tutorials
3. **API Documentation:** Tool reference and examples
4. **Developer Documentation:** Contributing guide and architecture

### Documentation Standards

- Use clear, concise language
- Include practical examples
- Keep documentation up-to-date with code changes
- Use proper markdown formatting

### Updating Documentation

- Update README for new features
- Add examples to TOOLS_REFERENCE.md
- Update deployment guides for infrastructure changes
- Add JSDoc comments for new APIs

## Release Process

### Version Management

We follow Semantic Versioning (SemVer):

- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes (backward compatible)

### Release Steps

1. **Update Version**
   ```bash
   npm version patch|minor|major
   ```

2. **Update Changelog**
   - Document all changes
   - Include breaking changes
   - Add migration notes if needed

3. **Create Release PR**
   - Update package.json version
   - Update CHANGELOG.md
   - Tag the release

4. **Deploy**
   - Build and test release candidate
   - Deploy to staging environment
   - Deploy to production

### Changelog Format

```markdown
## [1.2.0] - 2024-01-15

### Added
- New aggregation tools for analytics
- Support for scroll API in search

### Changed
- Improved error handling for connection issues
- Updated OpenSearch client to v2.4.0

### Fixed
- Fixed memory leak in bulk operations
- Resolved SSL certificate validation issues

### Breaking Changes
- Renamed configuration parameter `url` to `node`
```

## Community

### Getting Help

- **GitHub Issues:** Report bugs and request features
- **GitHub Discussions:** Ask questions and discuss ideas
- **Documentation:** Check existing guides and references

### Staying Informed

- Watch the repository for updates
- Follow release notes and changelogs
- Join community discussions

## Recognition

Contributors are recognized in:

- **CONTRIBUTORS.md:** List of all contributors
- **Release Notes:** Major contributions highlighted
- **GitHub:** Contributor statistics and activity

Thank you for contributing to the OpenSearch MCP Server! Your contributions help make this project better for everyone.