// Main exports for library usage
export { TldrawAgent } from './agent.js';
export { TldrawRenderer } from './renderer.js';
export { startMcpServer } from './mcp.js';

export type {
  AgentConfig,
  DrawRequest,
  DrawResult,
  Shape,
  Action,
  DiagramPlan,
  Position,
  Bounds,
  Color,
  Fill,
  ShapeType,
  ArrowBinding,
} from './types.js';

export {
  ShapeTypeSchema,
  PositionSchema,
  BoundsSchema,
  ColorSchema,
  FillSchema,
  ShapeSchema,
  ArrowBindingSchema,
  ActionSchema,
  DiagramPlanSchema,
} from './types.js';

export {
  DIAGRAM_SYSTEM_PROMPT,
  buildDiagramPrompt,
} from './prompts/diagram.js';
