import type { TemplateDefinition } from "../../template/registry";

export interface EffectNodeData {
  definition: TemplateDefinition;
  properties: Record<string, unknown>;
}

export interface ColorValue {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

export interface Point2dValue {
  x: number;
  y: number;
}

export interface Point3dValue extends Point2dValue {
  z: number;
}

export interface ObjectNumberBounds {
  min: number;
  max: number;
  step: number;
}

export interface EditableObjectNumberField {
  key: string;
  label: string;
  value: number;
  kind: "number";
  bounds: ObjectNumberBounds;
}

export interface EditableObjectBooleanField {
  key: string;
  label: string;
  value: boolean;
  kind: "boolean";
}

export interface EditableObjectNumberArrayField {
  key: string;
  label: string;
  value: number[];
  kind: "numberArray";
}

export type EditableObjectField =
  | EditableObjectNumberField
  | EditableObjectBooleanField
  | EditableObjectNumberArrayField;
