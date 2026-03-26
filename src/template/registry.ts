import sourceImage from "../../template/source.image.json";
import brightness from "../../template/fx.brightness.json";
import blur from "../../template/fx.blur.json";
import scalar from "../../template/math.scalar.json";

export type PortKind = "number" | "image" | "boolean";

export interface NumericParameter {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
}

export interface TemplateDefinition {
  type: string;
  label: string;
  category: string;
  description: string;
  accent: string;
  inputs: Array<{ id: string; label: string; kind: PortKind }>;
  outputs: Array<{ id: string; label: string; kind: PortKind }>;
  parameters: NumericParameter[];
}

export const templateItems = [
  sourceImage as TemplateDefinition,
  brightness as TemplateDefinition,
  blur as TemplateDefinition,
  scalar as TemplateDefinition,
];

export const templateByType = Object.fromEntries(
  templateItems.map((item) => [item.type, item]),
) as Record<string, TemplateDefinition>;
