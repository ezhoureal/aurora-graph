export type PortKind = "image" | "mask";

export interface TemplatePort {
  id: string;
  label: string;
  kind: PortKind;
}

interface TemplateParameterBase {
  id: string;
  label: string;
  description?: string;
  optional?: boolean;
}

export interface NumericParameter extends TemplateParameterBase {
  kind: "number";
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface BooleanParameter extends TemplateParameterBase {
  kind: "boolean";
  defaultValue: boolean;
}

export interface EnumParameter extends TemplateParameterBase {
  kind: "enum";
  defaultValue: string;
  options: string[];
}

export interface StringParameter extends TemplateParameterBase {
  kind: "string";
  defaultValue: string;
  placeholder?: string;
}

export interface ColorParameter extends TemplateParameterBase {
  kind: "color";
  defaultValue: unknown;
  shape?: string;
}

export interface MaskParameter extends TemplateParameterBase {
  kind: "mask";
  defaultValue: unknown;
  shape?: string;
}

export interface Point2dParameter extends TemplateParameterBase {
  kind: "point2d";
  defaultValue: unknown;
  shape?: string;
}

export interface Point3dParameter extends TemplateParameterBase {
  kind: "point3d";
  defaultValue: unknown;
  shape?: string;
}

export interface NumberTupleParameter extends TemplateParameterBase {
  kind: "numberTuple";
  defaultValue: unknown;
  shape?: string;
}

export interface NumberArrayParameter extends TemplateParameterBase {
  kind: "numberArray";
  defaultValue: unknown;
  shape?: string;
}

export interface PointArrayParameter extends TemplateParameterBase {
  kind: "pointArray";
  defaultValue: unknown;
  shape?: string;
}

export interface TupleArrayParameter extends TemplateParameterBase {
  kind: "tupleArray";
  defaultValue: unknown;
  shape?: string;
}

export interface GenericObjectParameter extends TemplateParameterBase {
  kind: "object";
  defaultValue: unknown;
  shape?: string;
}

export type TemplateParameter =
  | NumericParameter
  | BooleanParameter
  | EnumParameter
  | StringParameter
  | ColorParameter
  | MaskParameter
  | Point2dParameter
  | Point3dParameter
  | NumberTupleParameter
  | NumberArrayParameter
  | PointArrayParameter
  | TupleArrayParameter
  | GenericObjectParameter;

export interface TemplateDefinition {
  type: string;
  label: string;
  category: string;
  description: string;
  accent: string;
  inputs: TemplatePort[];
  outputs: TemplatePort[];
  parameters: TemplateParameter[];
}
