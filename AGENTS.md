# Agent Workflow Guidelines

## Development Workflow

When implementing new features or making changes, follow this systematic approach:

### 1. Code Implementation

- Implement the requested feature with clean, maintainable code
- Follow existing code patterns and conventions
- Use TypeScript best practices
- Ensure proper error handling

### 2. Quality Checks (Run ALL Before Completion)

**Build and Type Check:**

```bash
pnpm run build
```

- Ensures TypeScript compilation succeeds
- Validates type safety across the codebase

**ESLint:**

```bash
pnpm run lint
```

- Checks code style and quality
- Use `pnpm run lint:fix` for auto-fixable issues
- Fix ALL linting errors before proceeding

**Tests:**

```bash
pnpm test:run
```

- Run all test suites
- Ensure ALL tests pass
- Add new tests for new features
- Update existing tests if behavior changes

**Quick Check All:**

```bash
pnpm run check-all
```

- Runs type-check, lint, and tests in one command

### 3. Documentation Updates

**README.md:**

- Update usage examples if API changes
- Add documentation for new features
- Update CLI command examples
- Keep library AND CLI usage documentation in sync

**IMPORTANT:**

- **DO NOT** create separate markdown files for documentation unless explicitly requested
- **DO NOT** create CHANGES.md, UPDATES.md, or similar summary files
- Update README.md directly with new information
- Keep documentation concise and focused

### 4. Test Coverage

**Ensure comprehensive testing:**

- Use ALL test fixtures available in `test/fixtures/`
- Test both success and error cases
- Test edge cases (empty data, invalid formats, etc.)
- Verify both Full and Min Label Studio formats
- Test all PPOCRLabel format variations (dt_score, difficult fields)

### 5. Completion Checklist

Before marking work as complete:

- [ ] ✅ Build succeeds (`pnpm run build`)
- [ ] ✅ Type checking passes (`pnpm run type-check`)
- [ ] ✅ ESLint passes with no errors (`pnpm run lint`)
- [ ] ✅ All tests pass (`pnpm test:run`)
- [ ] ✅ README.md updated with new features
- [ ] ✅ No unnecessary documentation files created
- [ ] ✅ Code follows existing patterns
- [ ] ✅ Exports updated in lib/index.ts if needed

## Project Structure

### This is Both a CLI and a Library

**CLI Usage:**

```bash
label-studio-converter toLabelStudio ./input --outDir ./output
label-studio-converter enhance-ppocr ./data --sortVertical top-bottom
```

**Library Usage:**

```typescript
import {
  labelStudioToPPOCR,
  enhancePPOCRLabel,
  enhanceLabelStudioData,
} from 'label-studio-converter';
```

### Key Directories

- `src/commands/` - CLI command implementations
- `src/lib/` - Library functions (exported via index.ts)
- `test/` - Test suites
- `test/fixtures/` - Test data files
- `docs/images/` - Documentation images

### Naming Conventions

**Test Fixtures:**

- Use descriptive, lowercase names with underscores
- Format: `{format}_{variant}_{description}.{ext}`
- Examples: `ppocr_label_full.txt`, `label_studio_diamond.json`

**Documentation Images:**

- Use descriptive, lowercase names with hyphens
- Format: `{tool}_{context}_{description}.png`
- Examples: `label-studio-converted-example.png`

## Common Tasks

### Adding New Commands

1. Create command in `src/commands/{command-name}/`
2. Implement in `command.ts` and `impl.ts`
3. Register in `src/app.ts`
4. Export relevant functions from `src/lib/index.ts`
5. Add tests
6. Update README.md with usage examples

### Adding New Library Functions

1. Implement in appropriate `src/lib/*.ts` file
2. Export from `src/lib/index.ts`
3. Add TypeScript types/interfaces
4. Write tests
5. Document in README.md

### Schema Changes

1. Update `src/lib/schema.ts`
2. Run tests to verify compatibility
3. Update type definitions if needed
4. Document breaking changes in README.md

## Error Handling

Always provide clear error messages:

- Validation errors should indicate what's wrong
- File errors should include file paths
- Schema errors should show which field failed

## Performance Considerations

- Process files in batches when possible
- Use streaming for large files
- Avoid loading entire datasets into memory
- Use async/await for I/O operations

## Remember

1. **Quality over speed** - Take time to do it right
2. **Test everything** - Use all fixtures, test edge cases
3. **Document as you go** - Update README.md immediately
4. **Keep it simple** - Don't create unnecessary files
5. **Follow patterns** - Match existing code style
