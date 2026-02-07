# tldraw-agent

Portable diagram generation using tldraw's infinite canvas. Generate architecture diagrams, flowcharts, and visual content from text prompts.

## Features

- 🎨 **Natural language to diagrams** - Describe what you want, get a diagram
- 📦 **Portable** - Works as CLI, OpenClaw skill, MCP tool, or library
- 🖼️ **Export formats** - PNG, SVG output
- 🔄 **Streaming** - Progressive rendering for complex diagrams
- 🤖 **AI-powered** - Uses Claude/GPT for intelligent shape placement

## Installation

```bash
npm install @joelhooks/tldraw-agent
# or
bun add @joelhooks/tldraw-agent
```

## Usage

### CLI

```bash
# Generate a diagram
tldraw-agent draw "Architecture diagram: user → API gateway → microservices → database"

# Specify output
tldraw-agent draw "Flowchart for user signup" --output signup-flow.png

# SVG output
tldraw-agent draw "System components" --format svg
```

### Library

```typescript
import { TldrawAgent } from '@joelhooks/tldraw-agent';

const agent = new TldrawAgent({
  model: 'claude-sonnet-4-20250514', // optional, defaults to claude
});

const result = await agent.draw({
  prompt: 'Draw a cat sitting on a box',
  format: 'png',
  width: 1024,
  height: 768,
});

console.log(result.path); // /tmp/tldraw-abc123.png
```

### MCP Tool

Add to your MCP config:

```json
{
  "mcpServers": {
    "tldraw": {
      "command": "npx",
      "args": ["@joelhooks/tldraw-agent", "--mcp"]
    }
  }
}
```

Then use in Claude Desktop or any MCP client:
```
Draw an architecture diagram showing a load balancer, 3 app servers, and a database cluster
```

### OpenClaw Skill

The package auto-registers as an OpenClaw skill when installed globally:

```bash
npm install -g @joelhooks/tldraw-agent
```

Then in OpenClaw:
```
Draw a sequence diagram for the checkout flow
```

## Diagram Types

Works well for:
- Architecture diagrams
- Flowcharts
- Sequence diagrams (simple)
- Mind maps
- System component diagrams
- Entity relationship sketches
- Process flows

## How It Works

1. **Parse prompt** - Extract intent and components
2. **Generate actions** - LLM decides shapes, positions, connections
3. **Render canvas** - Headless tldraw renders the diagram
4. **Export** - Canvas exported as PNG or SVG

The rendering uses Playwright to run tldraw in a headless browser, ensuring pixel-perfect output matching tldraw's native rendering.

## Configuration

```typescript
const agent = new TldrawAgent({
  // LLM settings
  model: 'claude-sonnet-4-20250514',
  apiKey: process.env.ANTHROPIC_API_KEY,
  
  // Canvas settings
  width: 1024,
  height: 768,
  background: 'white',
  
  // Output settings
  format: 'png',
  outputDir: '/tmp/tldraw-agent',
});
```

## Development

```bash
git clone https://github.com/joelhooks/tldraw-agent
cd tldraw-agent
bun install
bun run dev
```

## License

MIT

## Credits

Built on [tldraw](https://github.com/tldraw/tldraw) - the infinite canvas library.
Inspired by [tldraw's agent template](https://github.com/tldraw/tldraw/tree/main/templates/agent).
