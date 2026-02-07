import { z } from 'zod';

// Shape types supported
export const ShapeTypeSchema = z.enum([
  'rectangle',
  'ellipse',
  'diamond',
  'arrow',
  'text',
  'line',
]);
export type ShapeType = z.infer<typeof ShapeTypeSchema>;

// Position on canvas
export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type Position = z.infer<typeof PositionSchema>;

// Bounds (position + dimensions)
export const BoundsSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});
export type Bounds = z.infer<typeof BoundsSchema>;

// Color palette (from tldraw's agent template)
export const ColorSchema = z.enum([
  'black',
  'blue',
  'green',
  'orange',
  'red',
  'violet',
  'yellow',
  'white',
  'grey',
]);
export type Color = z.infer<typeof ColorSchema>;

// Fill style
export const FillSchema = z.enum(['none', 'semi', 'solid', 'pattern']);
export type Fill = z.infer<typeof FillSchema>;

// Shape definition
export const ShapeSchema = z.object({
  id: z.string(),
  type: ShapeTypeSchema,
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  label: z.string().optional(),
  color: ColorSchema.optional(),
  fill: FillSchema.optional(),
});
export type Shape = z.infer<typeof ShapeSchema>;

// Arrow binding
export const ArrowBindingSchema = z.object({
  fromId: z.string(),
  toId: z.string(),
  label: z.string().optional(),
});
export type ArrowBinding = z.infer<typeof ArrowBindingSchema>;

// Actions the agent can take
export const ActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('create'),
    shape: ShapeSchema,
  }),
  z.object({
    type: z.literal('delete'),
    shapeId: z.string(),
  }),
  z.object({
    type: z.literal('move'),
    shapeId: z.string(),
    position: PositionSchema,
  }),
  z.object({
    type: z.literal('resize'),
    shapeId: z.string(),
    width: z.number(),
    height: z.number(),
  }),
  z.object({
    type: z.literal('connect'),
    arrow: ArrowBindingSchema,
  }),
  z.object({
    type: z.literal('label'),
    shapeId: z.string(),
    text: z.string(),
  }),
  z.object({
    type: z.literal('think'),
    thought: z.string(),
  }),
]);
export type Action = z.infer<typeof ActionSchema>;

// Agent configuration
export interface AgentConfig {
  model?: string;
  apiKey?: string;
  width?: number;
  height?: number;
  background?: string;
  format?: 'png' | 'svg';
  outputDir?: string;
}

// Draw request
export interface DrawRequest {
  prompt: string;
  format?: 'png' | 'svg';
  width?: number;
  height?: number;
  outputPath?: string;
}

// Draw result
export interface DrawResult {
  path: string;
  format: 'png' | 'svg';
  width: number;
  height: number;
  shapes: Shape[];
  actions: Action[];
}

// Diagram plan from LLM
export const DiagramPlanSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  shapes: z.array(ShapeSchema),
  connections: z.array(ArrowBindingSchema),
});
export type DiagramPlan = z.infer<typeof DiagramPlanSchema>;
