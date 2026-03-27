import type { ChangeEvent } from "react";
import type { TemplateParameter } from "../../template/registry";
import {
  clamp,
  editableParameterKinds,
  getEditableObjectFields,
  hexToColor,
  inferObjectFieldBounds,
  interactiveInputProps,
  normalizeColorValue,
  normalizeJsonValue,
  normalizeNumberArray,
  normalizeNumberTuple,
  normalizePoint2dValue,
  normalizePoint3dValue,
  parseNumberArray,
  rgbaToHex,
  stopEventPropagation,
  toObjectRecord,
  toStructuredEditorValue,
  tryParseJson,
} from "./helpers";

interface ParameterEditorProps {
  nodeId: string;
  parameters: TemplateParameter[];
  properties: Record<string, unknown>;
  updateNodeParameter: (nodeId: string, parameterId: string, value: unknown) => void;
}

export function ParameterEditor({
  nodeId,
  parameters,
  properties,
  updateNodeParameter,
}: ParameterEditorProps) {
  if (parameters.length === 0) {
    return null;
  }

  const numericParameters = parameters.filter(
    (parameter): parameter is Extract<TemplateParameter, { kind: "number" }> => parameter.kind === "number",
  );
  const booleanParameters = parameters.filter(
    (parameter): parameter is Extract<TemplateParameter, { kind: "boolean" }> => parameter.kind === "boolean",
  );
  const enumParameters = parameters.filter(
    (parameter): parameter is Extract<TemplateParameter, { kind: "enum" }> => parameter.kind === "enum",
  );
  const stringParameters = parameters.filter(
    (parameter): parameter is Extract<TemplateParameter, { kind: "string" }> => parameter.kind === "string",
  );
  const colorParameters = parameters.filter(
    (parameter): parameter is Extract<TemplateParameter, { kind: "color" }> => parameter.kind === "color",
  );
  const pointParameters = parameters.filter(
    (parameter): parameter is Extract<TemplateParameter, { kind: "point2d" | "point3d" }> =>
      parameter.kind === "point2d" || parameter.kind === "point3d",
  );
  const numberTupleParameters = parameters.filter(
    (parameter): parameter is Extract<TemplateParameter, { kind: "numberTuple" }> =>
      parameter.kind === "numberTuple",
  );
  const numberArrayParameters = parameters.filter(
    (parameter): parameter is Extract<TemplateParameter, { kind: "numberArray" }> =>
      parameter.kind === "numberArray",
  );
  const pointArrayParameters = parameters.filter(
    (parameter): parameter is Extract<TemplateParameter, { kind: "pointArray" }> =>
      parameter.kind === "pointArray",
  );
  const tupleArrayParameters = parameters.filter(
    (parameter): parameter is Extract<TemplateParameter, { kind: "tupleArray" }> =>
      parameter.kind === "tupleArray",
  );
  const objectParameters = parameters.filter(
    (parameter): parameter is Extract<TemplateParameter, { kind: "object" }> =>
      parameter.kind === "object",
  );
  const nonEditableParameters = parameters.filter(
    (parameter) => !editableParameterKinds.has(parameter.kind),
  );

  return (
    <div
      className="effect-node-parameters nodrag nopan"
      onMouseDown={stopEventPropagation}
      onPointerDownCapture={stopEventPropagation}
    >
      <span className="effect-node-column-label">Parameters</span>
      {numericParameters.map((parameter) => {
        const rawValue = properties[parameter.id];
        const value = typeof rawValue === "number" ? rawValue : parameter.defaultValue;
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
                updateNodeParameter(nodeId, parameter.id, Number(event.currentTarget.value))
              }
              {...interactiveInputProps}
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
                  updateNodeParameter(nodeId, parameter.id, event.currentTarget.checked)
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
              onChange={(event) => updateNodeParameter(nodeId, parameter.id, event.currentTarget.value)}
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
              onChange={(event) => updateNodeParameter(nodeId, parameter.id, event.currentTarget.value)}
              {...interactiveInputProps}
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
                    updateNodeParameter(nodeId, parameter.id, {
                      ...hexToColor(event.currentTarget.value),
                      alpha: value.alpha,
                    })
                  }
                  {...interactiveInputProps}
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
                    updateNodeParameter(nodeId, parameter.id, {
                      ...value,
                      alpha: clamp(Number(event.currentTarget.value), 0, 1),
                    })
                  }
                  {...interactiveInputProps}
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
                      updateNodeParameter(nodeId, parameter.id, {
                        ...value,
                        [axis]: Number(event.currentTarget.value),
                      })
                    }
                    {...interactiveInputProps}
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
                      updateNodeParameter(nodeId, parameter.id, nextTuple);
                    }}
                    {...interactiveInputProps}
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
                updateNodeParameter(nodeId, parameter.id, parseNumberArray(event.currentTarget.value))
              }
              {...interactiveInputProps}
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
                  updateNodeParameter(nodeId, parameter.id, parsed);
                }
              }}
              {...interactiveInputProps}
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
                  updateNodeParameter(nodeId, parameter.id, parsed);
                }
              }}
              {...interactiveInputProps}
            />
            <span className="parameter-hint">Edit as JSON array of numeric tuples.</span>
          </label>
        );
      })}
      {objectParameters.map((parameter) => {
        const value = normalizeJsonValue(properties[parameter.id], parameter.defaultValue);
        const editableFields = getEditableObjectFields(value, parameter.defaultValue);
        const supportsStructuredFields = editableFields.length > 0;
        // TODO: Keep a JSON fallback visible when object parameters still contain
        // unsupported members, otherwise fields like effect.liquidMaterial.param.ripplePosition
        // become uneditable after switching to the structured editor.

        return (
          <div className="parameter-row nodrag nopan" key={parameter.id}>
            <div className="parameter-label-row">
              <span>{parameter.label}</span>
              <span className="parameter-badge">{parameter.shape ?? "object"}</span>
            </div>
            {supportsStructuredFields ? (
              <div className="parameter-object-fields">
                {editableFields.map((field) => {
                  if (field.kind === "boolean") {
                    return (
                      <label
                        className="parameter-row parameter-row-toggle parameter-row-nested nodrag nopan"
                        key={field.key}
                      >
                        <div className="parameter-label-row">
                          <span>{field.label}</span>
                          <input
                            checked={field.value}
                            className="parameter-toggle"
                            type="checkbox"
                            onChange={(event) =>
                              updateNodeParameter(nodeId, parameter.id, {
                                ...toObjectRecord(value),
                                [field.key]: event.currentTarget.checked,
                              })
                            }
                            {...interactiveInputProps}
                          />
                        </div>
                      </label>
                    );
                  }

                  if (field.kind === "numberArray") {
                    return (
                      <div className="parameter-row parameter-row-nested nodrag nopan" key={field.key}>
                        <div className="parameter-label-row">
                          <span>{field.label}</span>
                          <span className="parameter-badge">tuple</span>
                        </div>
                        <div
                          className={`parameter-grid ${
                            field.value.length >= 3 ? "parameter-grid-3" : "parameter-grid-2"
                          }`}
                        >
                          {field.value.map((entry, index) => {
                            const bounds = inferObjectFieldBounds(`${field.key}${index}`, entry);
                            const supportsSlider = bounds.max > bounds.min;

                            return (
                              <label className="parameter-subfield" key={`${field.key}-${index}`}>
                                <span>{index + 1}</span>
                                <input
                                  className={`nodrag nopan ${
                                    supportsSlider ? "parameter-slider" : "parameter-input"
                                  }`}
                                  draggable={false}
                                  max={bounds.max}
                                  min={bounds.min}
                                  step={bounds.step}
                                  type={supportsSlider ? "range" : "number"}
                                  value={entry}
                                  onChange={(event) => {
                                    const nextTuple = [...field.value];
                                    nextTuple[index] = Number(event.currentTarget.value);
                                    updateNodeParameter(nodeId, parameter.id, {
                                      ...toObjectRecord(value),
                                      [field.key]: nextTuple,
                                    });
                                  }}
                                  {...interactiveInputProps}
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  const bounds = field.bounds ?? inferObjectFieldBounds(field.key, field.value);
                  const supportsSlider = bounds.max > bounds.min;

                  return (
                    <label className="parameter-row parameter-row-nested nodrag nopan" key={field.key}>
                      <div className="parameter-label-row">
                        <span>{field.label}</span>
                        <span className="parameter-value">
                          {field.value.toFixed(bounds.step < 1 ? 2 : 0)}
                        </span>
                      </div>
                      <input
                        className={`nodrag nopan ${
                          supportsSlider ? "parameter-slider" : "parameter-input"
                        }`}
                        draggable={false}
                        max={bounds.max}
                        min={bounds.min}
                        step={bounds.step}
                        type={supportsSlider ? "range" : "number"}
                        value={field.value}
                        onChange={(event) =>
                          updateNodeParameter(nodeId, parameter.id, {
                            ...toObjectRecord(value),
                            [field.key]: Number(event.currentTarget.value),
                          })
                        }
                        {...interactiveInputProps}
                      />
                    </label>
                  );
                })}
              </div>
            ) : (
              <>
                <textarea
                  className="parameter-textarea nodrag nopan"
                  defaultValue={toStructuredEditorValue(value)}
                  onBlur={(event) => {
                    const parsed = tryParseJson(event.currentTarget.value);
                    if (parsed !== undefined) {
                      updateNodeParameter(nodeId, parameter.id, parsed);
                    }
                  }}
                  {...interactiveInputProps}
                />
                <span className="parameter-hint">Edit structured values as JSON.</span>
              </>
            )}
          </div>
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
  );
}
