# 🎨 tldraw-agent

Generate diagrams from text. Works anywhere.

```bash
npx tldraw-agent draw "User → API → Database"
```

## Install

```bash
npm install -g @joelhooks/tldraw-agent
```

## Usage

### CLI
```bash
tldraw-agent draw "microservices architecture with load balancer"
tldraw-agent draw "signup flow" --format svg -o signup.svg
```

### Library
```typescript
import { TldrawAgent } from '@joelhooks/tldraw-agent'

const agent = new TldrawAgent()
const { path } = await agent.draw({ prompt: 'system diagram' })
```

### MCP
```json
{
  "mcpServers": {
    "tldraw": { "command": "npx", "args": ["@joelhooks/tldraw-agent", "--mcp"] }
  }
}
```

## Features

- 🖼️ PNG/SVG export
- 🤖 LLM-powered layout (Claude, GPT)
- 📐 Architecture, flowcharts, entity diagrams
- 🔌 Works as CLI, library, MCP tool, or agent skill

## Environment

```bash
export ANTHROPIC_API_KEY=sk-...
```

## License

MIT
