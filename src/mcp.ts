/**
 * MCP (Model Context Protocol) server implementation
 * Exposes tldraw-agent as an MCP tool for Claude Desktop and other MCP clients
 */

import { TldrawAgent } from './agent.js';
import * as fs from 'node:fs/promises';

// MCP protocol types (simplified)
interface McpRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface McpResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// Tool definition
const DRAW_DIAGRAM_TOOL: McpTool = {
  name: 'draw_diagram',
  description: `Generate a diagram from a text description. 
  
Creates visual diagrams including:
- Architecture diagrams (systems, services, databases)
- Flowcharts (processes, decision trees)
- Entity relationships
- Component diagrams
- Sequence flows (simplified)

Returns the diagram as a PNG image.`,
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Description of the diagram to create. Be specific about components, relationships, and layout.',
      },
      format: {
        type: 'string',
        enum: ['png', 'svg'],
        description: 'Output format (default: png)',
      },
      width: {
        type: 'number',
        description: 'Canvas width in pixels (default: 1024)',
      },
      height: {
        type: 'number',
        description: 'Canvas height in pixels (default: 768)',
      },
    },
    required: ['prompt'],
  },
};

let agent: TldrawAgent | null = null;

async function getAgent(): Promise<TldrawAgent> {
  if (!agent) {
    agent = new TldrawAgent();
  }
  return agent;
}

async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text?: string; data?: string; mimeType?: string }> }> {
  if (name !== 'draw_diagram') {
    throw new Error(`Unknown tool: ${name}`);
  }

  const prompt = args.prompt as string;
  const format = (args.format as 'png' | 'svg') || 'png';
  const width = (args.width as number) || 1024;
  const height = (args.height as number) || 768;

  const tldraw = await getAgent();
  const result = await tldraw.draw({
    prompt,
    format,
    width,
    height,
  });

  // Read the file and return as base64
  const imageBuffer = await fs.readFile(result.path);
  const base64 = imageBuffer.toString('base64');

  // Clean up temp file
  await fs.unlink(result.path).catch(() => {});

  if (format === 'svg') {
    return {
      content: [
        {
          type: 'text',
          text: imageBuffer.toString('utf-8'),
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'image',
        data: base64,
        mimeType: 'image/png',
      },
      {
        type: 'text',
        text: `Generated diagram with ${result.shapes.length} shapes.`,
      },
    ],
  };
}

async function handleRequest(request: McpRequest): Promise<McpResponse> {
  const { id, method, params } = request;

  try {
    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '0.1.0',
            serverInfo: {
              name: 'tldraw-agent',
              version: '0.1.0',
            },
            capabilities: {
              tools: {},
            },
          },
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: [DRAW_DIAGRAM_TOOL],
          },
        };

      case 'tools/call': {
        const { name, arguments: args } = params as { name: string; arguments: Record<string, unknown> };
        const result = await handleToolCall(name, args);
        return {
          jsonrpc: '2.0',
          id,
          result,
        };
      }

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`,
          },
        };
    }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

export async function startMcpServer(): Promise<void> {
  console.error('tldraw-agent MCP server starting...');

  // Read from stdin, write to stdout (MCP stdio transport)
  const readline = await import('node:readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on('line', async (line) => {
    try {
      const request = JSON.parse(line) as McpRequest;
      const response = await handleRequest(request);
      console.log(JSON.stringify(response));
    } catch (error) {
      console.error('Failed to parse request:', error);
    }
  });

  rl.on('close', async () => {
    if (agent) {
      await agent.close();
    }
    process.exit(0);
  });
}
