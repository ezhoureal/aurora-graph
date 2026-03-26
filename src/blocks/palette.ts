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

export interface PaletteItem {
  type: string;
  label: string;
  category: string;
  description: string;
  accent: string;
  inputs: Array<{ id: string; label: string; kind: PortKind }>;
  outputs: Array<{ id: string; label: string; kind: PortKind }>;
  parameters: NumericParameter[];
}

export const paletteItems: PaletteItem[] = [
  {
    type: "source.image",
    label: "Image Source",
    category: "Input",
    description: "Entry point for media or texture inputs.",
    accent: "#f97316",
    inputs: [],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    parameters: [],
  },
  {
    type: "fx.brightness",
    label: "Brightness",
    category: "Color",
    description: "Lift or reduce image luminance with a single control.",
    accent: "#22c55e",
    inputs: [
      { id: "image", label: "Image", kind: "image" },
      { id: "amount", label: "Amount", kind: "number" },
    ],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    parameters: [
      {
        id: "amount",
        label: "Amount",
        min: -1,
        max: 1,
        step: 0.01,
        defaultValue: 0.15,
      },
    ],
  },
  {
    type: "fx.blur",
    label: "Blur",
    category: "Filter",
    description: "Softens the incoming image signal.",
    accent: "#38bdf8",
    inputs: [
      { id: "image", label: "Image", kind: "image" },
      { id: "radius", label: "Radius", kind: "number" },
    ],
    outputs: [{ id: "image", label: "Image", kind: "image" }],
    parameters: [
      {
        id: "radius",
        label: "Radius",
        min: 0,
        max: 64,
        step: 1,
        defaultValue: 12,
      },
    ],
  },
  {
    type: "math.scalar",
    label: "Scalar",
    category: "Math",
    description: "Produces a numeric value for other blocks.",
    accent: "#eab308",
    inputs: [],
    outputs: [{ id: "value", label: "Value", kind: "number" }],
    parameters: [
      {
        id: "value",
        label: "Value",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.5,
      },
    ],
  },
];

export const paletteByType = Object.fromEntries(
  paletteItems.map((item) => [item.type, item]),
) as Record<string, PaletteItem>;
