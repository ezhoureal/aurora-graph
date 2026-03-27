import type { MouseEvent, PointerEvent } from "react";
import type { PortKind, TemplateParameter } from "../../template/registry";
import type {
  ColorValue,
  EditableObjectField,
  ObjectNumberBounds,
  Point2dValue,
  Point3dValue,
} from "./types";

export const kindToClass: Record<PortKind, string> = {
  image: "port port-image",
  mask: "port port-mask",
};

export const editableParameterKinds = new Set<TemplateParameter["kind"]>([
  "number",
  "boolean",
  "enum",
  "string",
  "color",
  "point2d",
  "point3d",
  "numberTuple",
  "numberArray",
  "pointArray",
  "tupleArray",
  "object",
]);

export const interactiveInputProps = {
  onMouseDown: stopEventPropagation,
  onPointerDownCapture: stopEventPropagation,
};

export function stopEventPropagation(
  event: MouseEvent<HTMLElement> | PointerEvent<HTMLElement> | { stopPropagation: () => void },
) {
  event.stopPropagation();
}

export function normalizeColorValue(rawValue: unknown, fallback: unknown): ColorValue {
  const source = isObjectLike(rawValue) ? rawValue : fallback;

  return {
    red: readNumber(source, "red", 1),
    green: readNumber(source, "green", 1),
    blue: readNumber(source, "blue", 1),
    alpha: readNumber(source, "alpha", 1),
  };
}

export function normalizePoint2dValue(rawValue: unknown, fallback: unknown): Point2dValue {
  const source = isObjectLike(rawValue) ? rawValue : fallback;

  return {
    x: readNumber(source, "x", 0),
    y: readNumber(source, "y", 0),
  };
}

export function normalizePoint3dValue(rawValue: unknown, fallback: unknown): Point3dValue {
  const source = isObjectLike(rawValue) ? rawValue : fallback;

  return {
    x: readNumber(source, "x", 0),
    y: readNumber(source, "y", 0),
    z: readNumber(source, "z", 0),
  };
}

export function rgbaToHex(color: ColorValue) {
  const channels = [color.red, color.green, color.blue].map((channel) =>
    Math.round(Math.max(0, Math.min(1, channel)) * 255)
      .toString(16)
      .padStart(2, "0"),
  );

  return `#${channels.join("")}`;
}

export function hexToColor(hex: string): Omit<ColorValue, "alpha"> {
  const sanitized = hex.replace("#", "");
  const red = Number.parseInt(sanitized.slice(0, 2), 16) / 255;
  const green = Number.parseInt(sanitized.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(sanitized.slice(4, 6), 16) / 255;

  return { red, green, blue };
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeNumberTuple(rawValue: unknown, fallback: unknown) {
  const source = Array.isArray(rawValue) ? rawValue : Array.isArray(fallback) ? fallback : [];
  return source.map((entry) => (typeof entry === "number" ? entry : 0));
}

export function normalizeNumberArray(rawValue: unknown, fallback: unknown) {
  const source = Array.isArray(rawValue) ? rawValue : Array.isArray(fallback) ? fallback : [];
  return source.map((entry) => (typeof entry === "number" ? entry : 0));
}

export function getEditableObjectFields(rawValue: unknown, fallback: unknown): EditableObjectField[] {
  const source = isObjectLike(rawValue) ? rawValue : isObjectLike(fallback) ? fallback : null;

  if (!source) {
    return [];
  }

  return Object.entries(source).reduce<EditableObjectField[]>((fields, [key, defaultEntry]) => {
    const currentEntry = isObjectLike(rawValue) ? rawValue[key] : undefined;

    if (typeof defaultEntry === "number") {
      const value = typeof currentEntry === "number" ? currentEntry : defaultEntry;
      fields.push({
        key,
        label: formatObjectFieldLabel(key),
        value,
        kind: "number",
        bounds: inferObjectFieldBounds(key, value),
      });
      return fields;
    }

    if (typeof defaultEntry === "boolean") {
      fields.push({
        key,
        label: formatObjectFieldLabel(key),
        value: typeof currentEntry === "boolean" ? currentEntry : defaultEntry,
        kind: "boolean",
      });
      return fields;
    }

    if (
      Array.isArray(defaultEntry) &&
      defaultEntry.length > 0 &&
      defaultEntry.every((entry) => typeof entry === "number")
    ) {
      fields.push({
        key,
        label: formatObjectFieldLabel(key),
        value: normalizeNumberArray(currentEntry, defaultEntry),
        kind: "numberArray",
      });
      return fields;
    }

    return fields;
  }, []);
}

export function inferObjectFieldBounds(name: string, value: number): ObjectNumberBounds {
  const integerLike = Number.isInteger(value);

  if (/alpha|progress|degree|fraction|saturation|rate|ratio/i.test(name)) {
    return { min: 0, max: 1, step: 0.01 };
  }

  if (/coeff/i.test(name)) {
    return { min: -1, max: 1, step: 0.01 };
  }

  if (/count/i.test(name)) {
    return { min: 1, max: 8, step: 1 };
  }

  if (/radius|width|height|x|y|z|intensity|factor/i.test(name)) {
    return { min: 0, max: 100, step: integerLike ? 1 : 0.1 };
  }

  if (/red|green|blue/i.test(name)) {
    return { min: 0, max: 1, step: 0.01 };
  }

  return { min: integerLike ? 0 : -1, max: integerLike ? 100 : 1, step: integerLike ? 1 : 0.01 };
}

export function toObjectRecord(value: unknown): Record<string, unknown> {
  return isObjectLike(value) ? value : {};
}

export function parseNumberArray(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry));
}

export function normalizeJsonValue(rawValue: unknown, fallback: unknown) {
  return rawValue ?? fallback;
}

export function toStructuredEditorValue(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}

export function tryParseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNumber(source: unknown, key: string, fallback: number) {
  if (!isObjectLike(source)) {
    return fallback;
  }

  const value = source[key];
  return typeof value === "number" ? value : fallback;
}

function formatObjectFieldLabel(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}
