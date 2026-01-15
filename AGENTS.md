# Agent Workflow Guidelines

## Code Conventions

### Naming Conventions

**Consistency is critical.** Always follow existing naming patterns in the codebase:

#### TypeScript/JavaScript

- **Variables and Parameters**: Use `camelCase`
  - ✅ `filePattern`, `sortVertical`, `baseImageDir`
  - ❌ `file_pattern`, `sort-vertical`, `BaseImageDir`

- **Constants**: Use `UPPER_SNAKE_CASE`
  - ✅ `DEFAULT_PPOCR_FILE_PATTERN`, `SORT_VERTICAL_NONE`
  - ❌ `defaultPpocrFilePattern`, `sortVerticalNone`

- **Types and Interfaces**: Use `PascalCase`
  - ✅ `VerticalSortOrder`, `CommandFlags`, `PPOCRLabel`
  - ❌ `verticalSortOrder`, `commandFlags`, `ppocrLabel`

- **Functions**: Use `camelCase`
  - ✅ `findFiles`, `convertToLabelStudio`, `enhancePPOCRLabel`
  - ❌ `find_files`, `ConvertToLabelStudio`

#### CLI Flags

- **Command Line Options**: Use `--camelCase` with kebab-case alternatives
  - ✅ `--filePattern`, `--sortVertical`, `--outDir`
  - ❌ `--file_pattern`, `--file-pattern`, `--FilePattern`

- **Boolean Flags**: Support both positive and negative forms
  - ✅ `--recursive/--noRecursive`, `--toFullJson/--noToFullJson`

#### File and Directory Naming

- **Test Files**: Use descriptive lowercase names with underscores
  - Format: `{format}_{variant}_{description}.{ext}`
  - ✅ `ppocr_label_full.txt`, `label_studio_diamond.json`
  - ❌ `ppocrLabel.txt`, `LabelStudioDiamond.json`

- **Documentation Images**: Use descriptive lowercase names with hyphens
  - Format: `{tool}_{context}_{description}.png`
  - ✅ `label-studio-converted-example.png`
  - ❌ `labelStudio_converted.png`

### Project Structure Conventions

- **Commands**: Each command has its own directory under `src/commands/`
  - Structure: `src/commands/{command-name}/command.ts` and `impl.ts`
  - Command file defines CLI interface
  - Implementation file contains logic

- **Library Functions**: Export from `src/lib/index.ts`
  - All public API functions must be exported
  - Keep implementation in appropriate module files

- **Constants**: Centralized in `src/constants.ts`
  - **ALL default flag values MUST be defined as constants**
  - Group related constants together (e.g., sorting options, shape normalization, backup options)
  - Document defaults clearly with comments
  - Use const assertions (`as const`) where appropriate
  - Examples:
    - `DEFAULT_BACKUP = false` - Default for --backup flag
    - `DEFAULT_RECURSIVE = false` - Default for --recursive flag
    - `DEFAULT_PPOCR_FILE_NAME = 'Label.txt'` - Default output filename

- **Command Flag Briefs**: Always reference constants in `command.ts` files
  - Import DEFAULT\_\* constants from `@/constants`
  - Use template literals to reference constants in brief descriptions
  - ✅ `brief: \`Create backup of existing files before overwriting. Default: \${DEFAULT_BACKUP}\``
  - ✅ `brief: \`Recursively search directories for files. Default: \${DEFAULT_RECURSIVE}\``
  - ❌ `brief: 'Create backup of existing files before overwriting. Default: false'`
  - This ensures defaults stay in sync between documentation and implementation

### Adding New Features

When adding new features, ensure consistency:

1. **Follow Existing Patterns**:
   - Look at similar features for naming guidance
   - Match parameter order and structure
   - Use the same error handling approach

2. **Update All Relevant Files**:
   - Command definition (`command.ts`)
   - Implementation (`impl.ts`)
   - **Constants - add DEFAULT\_\* constant for any new flag with a default value**
   - Tests for the new feature
   - README documentation
   - Export from `lib/index.ts` if public API

3. **Maintain Semantic Clarity**:
   - Choose names that clearly describe purpose
   - Prefer `filePattern` over `include` or `pattern` (more semantic)
   - Prefer `outDir` over `output` or `outputDirectory` (concise but clear)

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
