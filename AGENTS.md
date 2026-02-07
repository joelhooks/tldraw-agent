# AGENTS.md - tldraw-agent

## Purpose

Portable diagram generation using tldraw. Works as:
- CLI tool (`tldraw-agent draw "..."`)
- OpenClaw skill
- MCP tool for Claude Desktop / other MCP clients
- Programmatic library

## Architecture

```
User prompt → LLM (shape decisions) → tldraw actions → Canvas render → Export PNG/SVG
```

### Key Components

1. **TldrawAgent** (`src/agent.ts`) - Core agent class
   - Manages canvas state
   - Executes actions from LLM
   - Handles streaming

2. **Renderer** (`src/renderer.ts`) - Headless rendering
   - Uses Playwright for browser automation
   - Loads tldraw in headless Chrome
   - Exports to PNG/SVG

3. **Actions** (`src/actions/`) - Shape operations
   - CreateAction, DeleteAction, MoveAction, etc.
   - Based on tldraw's agent template patterns

4. **CLI** (`src/cli.ts`) - Command-line interface
   - `tldraw-agent draw "prompt"`
   - `tldraw-agent export <file>`

5. **MCP** (`src/mcp.ts`) - MCP tool wrapper
   - Exposes `draw_diagram` tool
   - Returns image data for inline display

## Development

```bash
bun install
bun run dev           # Watch mode
bun run build         # Production build
bun run test          # Run tests
```

## Code Quality

- TypeScript strict mode
- Biome for linting/formatting
- No `any` types unless absolutely necessary
- Test actions with vitest

## File Organization

```
src/
├── index.ts          # Main exports
├── cli.ts            # CLI entry point
├── agent.ts          # TldrawAgent class
├── renderer.ts       # Headless rendering
├── mcp.ts            # MCP tool wrapper
├── actions/          # Action implementations
│   ├── types.ts      # Shared types
│   ├── create.ts     # Create shapes
│   ├── delete.ts     # Delete shapes
│   ├── move.ts       # Move shapes
│   ├── connect.ts    # Draw arrows
│   └── label.ts      # Add text labels
└── prompts/          # System prompts
    └── diagram.ts    # Diagram generation prompt
```

## Portability Goals

This should work anywhere:
- Local CLI on any machine with Node
- OpenClaw via skill integration
- MCP for Claude Desktop, Cursor, etc.
- As a library imported into other projects

Keep dependencies minimal. Playwright is the heaviest dep but necessary for rendering.
