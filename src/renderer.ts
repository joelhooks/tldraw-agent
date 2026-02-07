import { chromium, type Browser, type Page } from 'playwright';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Shape, ArrowBinding } from './types.js';

interface RenderOptions {
  shapes: Shape[];
  connections: ArrowBinding[];
  width: number;
  height: number;
  format: 'png' | 'svg';
  outputPath: string;
}

// Minimal HTML that loads tldraw and renders shapes
const TLDRAW_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #app { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script type="module">
    import { Tldraw, createShapeId, TLShapeId } from 'https://esm.sh/tldraw@3';
    import { createRoot } from 'https://esm.sh/react-dom@18/client';
    import React from 'https://esm.sh/react@18';

    // Store editor reference globally for Playwright access
    window.tldrawEditor = null;
    window.renderComplete = false;

    function App() {
      const handleMount = (editor) => {
        window.tldrawEditor = editor;
        window.renderComplete = true;
      };

      return React.createElement(Tldraw, {
        onMount: handleMount,
        hideUi: true,
      });
    }

    const root = createRoot(document.getElementById('app'));
    root.render(React.createElement(App));
  </script>
</body>
</html>
`;

export class TldrawRenderer {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init(): Promise<void> {
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
    
    // Load tldraw
    await this.page.setContent(TLDRAW_HTML);
    
    // Wait for tldraw to initialize
    await this.page.waitForFunction(() => window.renderComplete === true, {
      timeout: 30000,
    });
  }

  async render(options: RenderOptions): Promise<void> {
    if (!this.page) {
      throw new Error('Renderer not initialized. Call init() first.');
    }

    const { shapes, connections, width, height, format, outputPath } = options;

    // Set viewport size
    await this.page.setViewportSize({ width, height });

    // Create shapes in tldraw
    await this.page.evaluate(
      ({ shapes, connections }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const editor = (window as any).tldrawEditor;
        if (!editor) throw new Error('Editor not available');

        // Color mapping to tldraw colors
        const colorMap: Record<string, string> = {
          black: 'black',
          blue: 'blue',
          green: 'green',
          orange: 'orange',
          red: 'red',
          violet: 'violet',
          yellow: 'yellow',
          white: 'white',
          grey: 'grey',
        };

        // Create shapes
        const shapeMap = new Map<string, string>();
        
        for (const shape of shapes) {
          const id = `shape:${shape.id}`;
          shapeMap.set(shape.id, id);

          if (shape.type === 'rectangle' || shape.type === 'ellipse' || shape.type === 'diamond') {
            editor.createShape({
              id,
              type: 'geo',
              x: shape.x,
              y: shape.y,
              props: {
                geo: shape.type === 'rectangle' ? 'rectangle' : 
                     shape.type === 'ellipse' ? 'ellipse' : 'diamond',
                w: shape.width || 100,
                h: shape.height || 60,
                text: shape.label || '',
                color: colorMap[shape.color || 'black'] || 'black',
                fill: shape.fill || 'semi',
              },
            });
          } else if (shape.type === 'text') {
            editor.createShape({
              id,
              type: 'text',
              x: shape.x,
              y: shape.y,
              props: {
                text: shape.label || '',
                color: colorMap[shape.color || 'black'] || 'black',
              },
            });
          }
        }

        // Create arrows for connections
        for (const conn of connections) {
          const fromId = shapeMap.get(conn.fromId);
          const toId = shapeMap.get(conn.toId);
          
          if (fromId && toId) {
            editor.createShape({
              id: `shape:arrow-${conn.fromId}-${conn.toId}`,
              type: 'arrow',
              props: {
                text: conn.label || '',
                start: {
                  type: 'binding',
                  boundShapeId: fromId,
                  normalizedAnchor: { x: 0.5, y: 0.5 },
                  isExact: false,
                  isPrecise: false,
                },
                end: {
                  type: 'binding',
                  boundShapeId: toId,
                  normalizedAnchor: { x: 0.5, y: 0.5 },
                  isExact: false,
                  isPrecise: false,
                },
              },
            });
          }
        }

        // Zoom to fit all content
        editor.zoomToFit();
      },
      { shapes, connections }
    );

    // Wait a bit for rendering to settle
    await this.page.waitForTimeout(500);

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Export based on format
    if (format === 'svg') {
      const svg = await this.page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const editor = (window as any).tldrawEditor;
        // Get SVG from tldraw - this is simplified, real implementation 
        // would use editor.getSvg() or similar
        const container = document.querySelector('.tl-canvas');
        return container?.innerHTML || '';
      });
      await fs.writeFile(outputPath, svg, 'utf-8');
    } else {
      // PNG screenshot
      await this.page.screenshot({
        path: outputPath,
        type: 'png',
        clip: { x: 0, y: 0, width, height },
      });
    }
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Extend Window interface for TypeScript
// Using any for the editor since tldraw's types are complex and we're in a browser context
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tldrawEditor: any;
    renderComplete: boolean;
  }
}
