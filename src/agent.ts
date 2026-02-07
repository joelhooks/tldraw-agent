import { generateObject } from 'ai';
import { DiagramPlanSchema, type AgentConfig, type DiagramPlan, type DrawRequest, type DrawResult } from './types.js';
import { DIAGRAM_SYSTEM_PROMPT, buildDiagramPrompt } from './prompts/diagram.js';
import { TldrawRenderer } from './renderer.js';

const DEFAULT_CONFIG: Required<Omit<AgentConfig, 'apiKey' | 'gatewayUrl'>> & { model: string } = {
  model: 'anthropic/claude-sonnet-4-20250514',
  width: 1024,
  height: 768,
  background: 'white',
  format: 'png',
  outputDir: '/tmp/tldraw-agent',
};

export class TldrawAgent {
  private config: typeof DEFAULT_CONFIG;
  private renderer: TldrawRenderer | null = null;

  constructor(config: AgentConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // AI SDK uses AI_GATEWAY_API_KEY env var automatically
    if (!process.env.AI_GATEWAY_API_KEY) {
      throw new Error('AI_GATEWAY_API_KEY is required. Set it via env var.');
    }
  }

  /**
   * Generate a diagram from a text prompt
   */
  async draw(request: DrawRequest): Promise<DrawResult> {
    const format = request.format || this.config.format;
    const width = request.width || this.config.width;
    const height = request.height || this.config.height;

    // Step 1: Get diagram plan from LLM
    const plan = await this.planDiagram(request.prompt);

    // Step 2: Render the diagram
    if (!this.renderer) {
      this.renderer = new TldrawRenderer();
      await this.renderer.init();
    }

    const outputPath = request.outputPath || this.generateOutputPath(format);
    
    await this.renderer.render({
      shapes: plan.shapes,
      connections: plan.connections,
      width,
      height,
      format,
      outputPath,
    });

    return {
      path: outputPath,
      format,
      width,
      height,
      shapes: plan.shapes,
      actions: plan.shapes.map(s => ({ type: 'create' as const, shape: s })),
    };
  }

  /**
   * Ask LLM to plan the diagram using AI SDK generateObject
   * AI SDK auto-routes through Vercel AI Gateway when AI_GATEWAY_API_KEY is set
   */
  private async planDiagram(prompt: string): Promise<DiagramPlan> {
    const { object } = await generateObject({
      model: this.config.model as any, // AI SDK uses string model IDs with gateway
      schema: DiagramPlanSchema,
      system: DIAGRAM_SYSTEM_PROMPT,
      prompt: buildDiagramPrompt(prompt),
    });

    return object;
  }

  /**
   * Generate unique output path
   */
  private generateOutputPath(format: 'png' | 'svg'): string {
    const id = Math.random().toString(36).substring(2, 10);
    return `${this.config.outputDir}/diagram-${id}.${format}`;
  }

  /**
   * Clean up resources
   */
  async close(): Promise<void> {
    if (this.renderer) {
      await this.renderer.close();
      this.renderer = null;
    }
  }
}
