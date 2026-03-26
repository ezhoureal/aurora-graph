import { memo, type ChangeEvent } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { useGraphStore } from "../store/useGraphStore";
import type { PortKind, TemplateDefinition, TemplateParameter } from "../template/registry";

export interface EffectNodeData {
  definition: TemplateDefinition;
  properties: Record<string, unknown>;
}

const kindToClass: Record<PortKind, string> = {
  image: "port port-image",
  mask: "port port-mask",
};

interface ColorValue {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

interface Point2dValue {
  x: number;
  y: number;
}

interface Point3dValue extends Point2dValue {
  z: number;
}

function EffectNode({ id, data, selected }: NodeProps<EffectNodeData>) {
  const { definition, properties } = data;
  const updateNodeParameter = useGraphStore((state) => state.updateNodeParameter);
  const parameterIds = new Set(definition.parameters.map((parameter) => parameter.id));
  const visibleInputs = definition.inputs.filter((input) => !parameterIds.has(input.id));
  const numericParameters = definition.parameters.filter(
    (parameter): parameter is Extract<TemplateParameter, { kind: "number" }> => parameter.kind === "number",
  );
  const booleanParameters = definition.parameters.filter(
    (parameter): parameter is Extract<TemplateParameter, { kind: "boolean" }> => parameter.kind === "boolean",
  );
  const enumParameters = definition.parameters.filter(
    (parameter): parameter is Extract<TemplateParameter, { kind: "enum" }> => parameter.kind === "enum",
  );
  const stringParameters = definition.parameters.filter(
    (parameter): parameter is Extract<TemplateParameter, { kind: "string" }> => parameter.kind === "string",
  );
  const colorParameters = definition.parameters.filter(
    (parameter): parameter is Extract<TemplateParameter, { kind: "color" }> => parameter.kind === "color",
  );
  const pointParameters = definition.parameters.filter(
    (parameter): parameter is Extract<TemplateParameter, { kind: "point2d" | "point3d" }> =>
      parameter.kind === "point2d" || parameter.kind === "point3d",
  );
  const numberTupleParameters = definition.parameters.filter(
    (parameter): parameter is Extract<TemplateParameter, { kind: "numberTuple" }> =>
      parameter.kind === "numberTuple",
  );
  const numberArrayParameters = definition.parameters.filter(
    (parameter): parameter is Extract<TemplateParameter, { kind: "numberArray" }> =>
      parameter.kind === "numberArray",
  );
  const pointArrayParameters = definition.parameters.filter(
    (parameter): parameter is Extract<TemplateParameter, { kind: "pointArray" }> =>
      parameter.kind === "pointArray",
  );
  const tupleArrayParameters = definition.parameters.filter(
    (parameter): parameter is Extract<TemplateParameter, { kind: "tupleArray" }> =>
      parameter.kind === "tupleArray",
  );
  const objectParameters = definition.parameters.filter(
    (parameter): parameter is Extract<TemplateParameter, { kind: "object" }> =>
      parameter.kind === "object",
  );
  const nonEditableParameters = definition.parameters.filter(
    (parameter) =>
      ![
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
      ].includes(parameter.kind),
  );

  return (
    <article
      className={`effect-node${selected ? " effect-node-selected" : ""}`}
      style={{ ["--node-accent" as string]: definition.accent }}
    >
      <header className="effect-node-header">
        <span className="effect-node-category">{definition.category}</span>
        <h3>{definition.label}</h3>
        <p>{definition.description}</p>
      </header>

      <div className="effect-node-body">
        <div className="effect-node-port-grid">
          <div className="effect-node-column">
            <span className="effect-node-column-label">Inputs</span>
            {visibleInputs.length > 0 ? (
              visibleInputs.map((input) => (
                <div className="port-row" key={input.id}>
                  <Handle
                    className={kindToClass[input.kind]}
                    id={input.id}
                    type="target"
                    position={Position.Left}
                  />
                  <span>{input.label}</span>
                </div>
              ))
            ) : (
              <span className="port-empty">No inputs</span>
            )}
          </div>

          <div className="effect-node-column align-end">
            <span className="effect-node-column-label">Outputs</span>
            {definition.outputs.length > 0 ? (
              definition.outputs.map((output) => (
                <div className="port-row align-end" key={output.id}>
                  <span>{output.label}</span>
                  <Handle
                    className={kindToClass[output.kind]}
                    id={output.id}
                    type="source"
                    position={Position.Right}
                  />
                </div>
              ))
            ) : (
              <span className="port-empty">No outputs</span>
            )}
          </div>
        </div>

        {definition.parameters.length > 0 ? (
          <div
            className="effect-node-parameters nodrag nopan"
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDownCapture={(event) => event.stopPropagation()}
          >
            <span className="effect-node-column-label">Parameters</span>
            {numericParameters.map((parameter) => {
              const rawValue = properties[parameter.id];
              const value =
                typeof rawValue === "number" ? rawValue : parameter.defaultValue;
              const supportsSlider =
                typeof parameter.min === "number" && typeof parameter.max === "number";

              return (
                <label className="parameter-row nodrag nopan" key={parameter.id}>
                  <div className="parameter-label-row">
                    <span>{parameter.label}</span>
                    <span className="parameter-value">
                      {value.toFixed((parameter.step ?? 1) < 1 ? 2 : 0)}
                      {parameter.unit ? ` ${parameter.unit}` : ""}
                    </span>
                  </div>
                  <input
                    className={`parameter-slider nodrag nopan${supportsSlider ? "" : " parameter-input"}`}
                    draggable={false}
                    min={parameter.min}
                    max={parameter.max}
                    step={parameter.step ?? 0.01}
                    type={supportsSlider ? "range" : "number"}
                    value={value}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      updateNodeParameter(id, parameter.id, Number(event.currentTarget.value))
                    }
                    onMouseDown={(event) => event.stopPropagation()}
                    onPointerDownCapture={(event) => event.stopPropagation()}
                  />
                </label>
              );
            })}
            {booleanParameters.map((parameter) => {
              const value =
                typeof properties[parameter.id] === "boolean"
                  ? (properties[parameter.id] as boolean)
                  : parameter.defaultValue;

              return (
                <label className="parameter-row parameter-row-toggle nodrag nopan" key={parameter.id}>
                  <div className="parameter-label-row">
                    <span>{parameter.label}</span>
                    <input
                      checked={value}
                      className="parameter-toggle"
                      type="checkbox"
                      onChange={(event) =>
                        updateNodeParameter(id, parameter.id, event.currentTarget.checked)
                      }
                    />
                  </div>
                </label>
              );
            })}
            {enumParameters.map((parameter) => {
              const value =
                typeof properties[parameter.id] === "string"
                  ? (properties[parameter.id] as string)
                  : parameter.defaultValue;

              return (
                <label className="parameter-row nodrag nopan" key={parameter.id}>
                  <div className="parameter-label-row">
                    <span>{parameter.label}</span>
                    <span className="parameter-badge">enum</span>
                  </div>
                  <select
                    className="parameter-select nodrag nopan"
                    value={value}
                    onChange={(event) => updateNodeParameter(id, parameter.id, event.currentTarget.value)}
                  >
                    {parameter.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
            {stringParameters.map((parameter) => {
              const value =
                typeof properties[parameter.id] === "string"
                  ? (properties[parameter.id] as string)
                  : parameter.defaultValue;

              return (
                <label className="parameter-row nodrag nopan" key={parameter.id}>
                  <div className="parameter-label-row">
                    <span>{parameter.label}</span>
                    <span className="parameter-badge">text</span>
                  </div>
                  <input
                    className="parameter-input nodrag nopan"
                    placeholder={parameter.placeholder}
                    type="text"
                    value={value}
                    onChange={(event) => updateNodeParameter(id, parameter.id, event.currentTarget.value)}
                    onMouseDown={(event) => event.stopPropagation()}
                    onPointerDownCapture={(event) => event.stopPropagation()}
                  />
                </label>
              );
            })}
            {colorParameters.map((parameter) => {
              const value = normalizeColorValue(properties[parameter.id], parameter.defaultValue);

              return (
                <div className="parameter-row nodrag nopan" key={parameter.id}>
                  <div className="parameter-label-row">
                    <span>{parameter.label}</span>
                    <span className="parameter-badge">color</span>
                  </div>
                  <div className="parameter-color-grid">
                    <label className="parameter-subfield parameter-subfield-color">
                      <span>Color</span>
                      <input
                        className="parameter-color-picker nodrag nopan"
                        type="color"
                        value={rgbaToHex(value)}
                        onChange={(event) =>
                          updateNodeParameter(id, parameter.id, {
                            ...hexToColor(event.currentTarget.value),
                            alpha: value.alpha,
                          })
                        }
                      />
                    </label>
                    <label className="parameter-subfield parameter-subfield-alpha">
                      <span>Alpha</span>
                      <input
                        className="parameter-input nodrag nopan"
                        max={1}
                        min={0}
                        step={0.01}
                        type="number"
                        value={value.alpha}
                        onChange={(event) =>
                          updateNodeParameter(id, parameter.id, {
                            ...value,
                            alpha: clamp(Number(event.currentTarget.value), 0, 1),
                          })
                        }
                      />
                    </label>
                  </div>
                </div>
              );
            })}
            {pointParameters.map((parameter) => {
              const value =
                parameter.kind === "point3d"
                  ? normalizePoint3dValue(properties[parameter.id], parameter.defaultValue)
                  : normalizePoint2dValue(properties[parameter.id], parameter.defaultValue);

              return (
                <div className="parameter-row nodrag nopan" key={parameter.id}>
                  <div className="parameter-label-row">
                    <span>{parameter.label}</span>
                    <span className="parameter-badge">{parameter.kind}</span>
                  </div>
                  <div
                    className={`parameter-grid ${
                      parameter.kind === "point3d" ? "parameter-grid-3" : "parameter-grid-2"
                    }`}
                  >
                    {Object.entries(value).map(([axis, axisValue]) => (
                      <label className="parameter-subfield" key={axis}>
                        <span>{axis.toUpperCase()}</span>
                        <input
                          className="parameter-input nodrag nopan"
                          step={0.01}
                          type="number"
                          value={axisValue}
                          onChange={(event) =>
                            updateNodeParameter(id, parameter.id, {
                              ...value,
                              [axis]: Number(event.currentTarget.value),
                            })
                          }
                        />
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
            {numberTupleParameters.map((parameter) => {
              const tuple = normalizeNumberTuple(properties[parameter.id], parameter.defaultValue);

              return (
                <div className="parameter-row nodrag nopan" key={parameter.id}>
                  <div className="parameter-label-row">
                    <span>{parameter.label}</span>
                    <span className="parameter-badge">tuple</span>
                  </div>
                  <div className="parameter-grid">
                    {tuple.map((entry, index) => (
                      <label className="parameter-subfield" key={index}>
                        <span>{index + 1}</span>
                        <input
                          className="parameter-input nodrag nopan"
                          step={0.01}
                          type="number"
                          value={entry}
                          onChange={(event) => {
                            const nextTuple = [...tuple];
                            nextTuple[index] = Number(event.currentTarget.value);
                            updateNodeParameter(id, parameter.id, nextTuple);
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
            {numberArrayParameters.map((parameter) => {
              const values = normalizeNumberArray(properties[parameter.id], parameter.defaultValue);

              return (
                <label className="parameter-row nodrag nopan" key={parameter.id}>
                  <div className="parameter-label-row">
                    <span>{parameter.label}</span>
                    <span className="parameter-badge">numbers</span>
                  </div>
                  <input
                    className="parameter-input nodrag nopan"
                    defaultValue={values.join(", ")}
                    placeholder="0, 10, 20"
                    type="text"
                    onBlur={(event) =>
                      updateNodeParameter(id, parameter.id, parseNumberArray(event.currentTarget.value))
                    }
                  />
                </label>
              );
            })}
            {pointArrayParameters.map((parameter) => {
              const value = normalizeJsonValue(properties[parameter.id], parameter.defaultValue);

              return (
                <label className="parameter-row nodrag nopan" key={parameter.id}>
                  <div className="parameter-label-row">
                    <span>{parameter.label}</span>
                    <span className="parameter-badge">points</span>
                  </div>
                  <textarea
                    className="parameter-textarea nodrag nopan"
                    defaultValue={toStructuredEditorValue(value)}
                    onBlur={(event) => {
                      const parsed = tryParseJson(event.currentTarget.value);
                      if (parsed !== undefined) {
                        updateNodeParameter(id, parameter.id, parsed);
                      }
                    }}
                  />
                  <span className="parameter-hint">Edit as JSON array of point objects.</span>
                </label>
              );
            })}
            {tupleArrayParameters.map((parameter) => {
              const value = normalizeJsonValue(properties[parameter.id], parameter.defaultValue);

              return (
                <label className="parameter-row nodrag nopan" key={parameter.id}>
                  <div className="parameter-label-row">
                    <span>{parameter.label}</span>
                    <span className="parameter-badge">tuples</span>
                  </div>
                  <textarea
                    className="parameter-textarea nodrag nopan"
                    defaultValue={toStructuredEditorValue(value)}
                    onBlur={(event) => {
                      const parsed = tryParseJson(event.currentTarget.value);
                      if (parsed !== undefined) {
                        updateNodeParameter(id, parameter.id, parsed);
                      }
                    }}
                  />
                  <span className="parameter-hint">Edit as JSON array of numeric tuples.</span>
                </label>
              );
            })}
            {objectParameters.map((parameter) => {
              const value = normalizeJsonValue(properties[parameter.id], parameter.defaultValue);

              return (
                <label className="parameter-row nodrag nopan" key={parameter.id}>
                  <div className="parameter-label-row">
                    <span>{parameter.label}</span>
                    <span className="parameter-badge">{parameter.shape ?? "object"}</span>
                  </div>
                  <textarea
                    className="parameter-textarea nodrag nopan"
                    defaultValue={toStructuredEditorValue(value)}
                    onBlur={(event) => {
                      const parsed = tryParseJson(event.currentTarget.value);
                      if (parsed !== undefined) {
                        updateNodeParameter(id, parameter.id, parsed);
                      }
                    }}
                  />
                  <span className="parameter-hint">Edit structured values as JSON.</span>
                </label>
              );
            })}
            {nonEditableParameters.map((parameter) => (
              <div className="parameter-row parameter-row-static" key={parameter.id}>
                <div className="parameter-label-row">
                  <span>{parameter.label}</span>
                  <span className="parameter-badge">{parameter.kind}</span>
                </div>
                <span className="parameter-hint">
                  {parameter.description ?? "Structured parameter carried through the DAG JSON export."}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default memo(EffectNode);

function normalizeColorValue(rawValue: unknown, fallback: unknown): ColorValue {
  const source = isObjectLike(rawValue) ? rawValue : fallback;

  return {
    red: readNumber(source, "red", 1),
    green: readNumber(source, "green", 1),
    blue: readNumber(source, "blue", 1),
    alpha: readNumber(source, "alpha", 1),
  };
}

function normalizePoint2dValue(rawValue: unknown, fallback: unknown): Point2dValue {
  const source = isObjectLike(rawValue) ? rawValue : fallback;

  return {
    x: readNumber(source, "x", 0),
    y: readNumber(source, "y", 0),
  };
}

function normalizePoint3dValue(rawValue: unknown, fallback: unknown): Point3dValue {
  const source = isObjectLike(rawValue) ? rawValue : fallback;

  return {
    x: readNumber(source, "x", 0),
    y: readNumber(source, "y", 0),
    z: readNumber(source, "z", 0),
  };
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

function rgbaToHex(color: ColorValue) {
  const channels = [color.red, color.green, color.blue].map((channel) =>
    Math.round(Math.max(0, Math.min(1, channel)) * 255)
      .toString(16)
      .padStart(2, "0"),
  );

  return `#${channels.join("")}`;
}

function hexToColor(hex: string): Omit<ColorValue, "alpha"> {
  const sanitized = hex.replace("#", "");
  const red = Number.parseInt(sanitized.slice(0, 2), 16) / 255;
  const green = Number.parseInt(sanitized.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(sanitized.slice(4, 6), 16) / 255;

  return { red, green, blue };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeNumberTuple(rawValue: unknown, fallback: unknown) {
  const source = Array.isArray(rawValue) ? rawValue : Array.isArray(fallback) ? fallback : [];
  return source.map((entry) => (typeof entry === "number" ? entry : 0));
}

function normalizeNumberArray(rawValue: unknown, fallback: unknown) {
  const source = Array.isArray(rawValue) ? rawValue : Array.isArray(fallback) ? fallback : [];
  return source.map((entry) => (typeof entry === "number" ? entry : 0));
}

function parseNumberArray(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry));
}

function normalizeJsonValue(rawValue: unknown, fallback: unknown) {
  return rawValue ?? fallback;
}

function toStructuredEditorValue(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}

function tryParseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}
