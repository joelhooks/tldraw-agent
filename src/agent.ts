import Anthropic from '@anthropic-ai/sdk';
import { DiagramPlanSchema, type AgentConfig, type DiagramPlan, type DrawRequest, type DrawResult } from './types.js';
import { DIAGRAM_SYSTEM_PROMPT, buildDiagramPrompt } from './prompts/diagram.js';
import { TldrawRenderer } from './renderer.js';

const DEFAULT_CONFIG: Required<AgentConfig> = {
  model: 'claude-sonnet-4-20250514',
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  width: 1024,
  height: 768,
  background: 'white',
  format: 'png',
  outputDir: '/tmp/tldraw-agent',
};

export class TldrawAgent {
  private config: Required<AgentConfig>;
  private client: Anthropic;
  private renderer: TldrawRenderer | null = null;

  constructor(config: AgentConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (!this.config.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required. Set it via env var or config.');
    }
    
    this.client = new Anthropic({ apiKey: this.config.apiKey });
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
   * Ask LLM to plan the diagram
   */
  private async planDiagram(prompt: string): Promise<DiagramPlan> {
    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 4096,
      system: DIAGRAM_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildDiagramPrompt(prompt) }
      ],
    });

    // Extract text content
    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from LLM');
    }

    // Parse JSON response
    let parsed: unknown;
    try {
      // Handle potential markdown code blocks
      let jsonText = textBlock.text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      parsed = JSON.parse(jsonText);
    } catch (e) {
      throw new Error(`Failed to parse LLM response as JSON: ${textBlock.text}`);
    }

    // Validate with Zod
    const result = DiagramPlanSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`Invalid diagram plan: ${result.error.message}`);
    }

    return result.data;
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
