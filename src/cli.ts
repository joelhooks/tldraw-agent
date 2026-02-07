#!/usr/bin/env node

import { TldrawAgent } from './agent.js';
import { startMcpServer } from './mcp.js';

async function main() {
  const args = process.argv.slice(2);
  
  // Check for MCP mode
  if (args.includes('--mcp') || args.includes('-m')) {
    await startMcpServer();
    return;
  }

  // Parse command
  const command = args[0];
  
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === 'draw') {
    await handleDraw(args.slice(1));
    return;
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exit(1);
}

async function handleDraw(args: string[]) {
  // Parse arguments
  let prompt = '';
  let format: 'png' | 'svg' = 'png';
  let output: string | undefined;
  let width = 1024;
  let height = 768;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--format' || arg === '-f') {
      const val = args[++i];
      if (val === 'png' || val === 'svg') {
        format = val;
      } else {
        console.error('Format must be png or svg');
        process.exit(1);
      }
    } else if (arg === '--output' || arg === '-o') {
      output = args[++i];
    } else if (arg === '--width' || arg === '-w') {
      width = parseInt(args[++i], 10);
    } else if (arg === '--height' || arg === '-h') {
      height = parseInt(args[++i], 10);
    } else if (!arg.startsWith('-')) {
      prompt = arg;
    }
  }

  if (!prompt) {
    console.error('Error: No prompt provided');
    console.log('Usage: tldraw-agent draw "your prompt here"');
    process.exit(1);
  }

  console.log(`Generating diagram: "${prompt}"`);
  console.log(`Format: ${format}, Size: ${width}x${height}`);

  const agent = new TldrawAgent();
  
  try {
    const result = await agent.draw({
      prompt,
      format,
      width,
      height,
      outputPath: output,
    });

    console.log(`✓ Diagram saved to: ${result.path}`);
    console.log(`  Shapes: ${result.shapes.length}`);
  } catch (error) {
    console.error('Error generating diagram:', error);
    process.exit(1);
  } finally {
    await agent.close();
  }
}

function printHelp() {
  console.log(`
tldraw-agent - Generate diagrams from text prompts

Usage:
  tldraw-agent draw <prompt> [options]
  tldraw-agent --mcp              Start MCP server

Commands:
  draw    Generate a diagram from a text prompt
  help    Show this help message

Options for draw:
  -f, --format <format>   Output format: png or svg (default: png)
  -o, --output <path>     Output file path
  -w, --width <pixels>    Canvas width (default: 1024)
  -h, --height <pixels>   Canvas height (default: 768)

Examples:
  tldraw-agent draw "User -> API -> Database"
  tldraw-agent draw "Flowchart for signup" --format svg -o signup.svg
  tldraw-agent draw "Microservices architecture" --width 1600 --height 1200

Environment:
  ANTHROPIC_API_KEY       Required. Your Anthropic API key.
`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
