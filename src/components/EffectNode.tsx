import { memo, type ChangeEvent } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { useGraphStore } from "../store/useGraphStore";
import type { PortKind, TemplateDefinition } from "../template/registry";

export interface EffectNodeData {
  definition: TemplateDefinition;
  properties: Record<string, number>;
}

const kindToClass: Record<PortKind, string> = {
  boolean: "port port-boolean",
  image: "port port-image",
  number: "port port-number",
};

function EffectNode({ id, data, selected }: NodeProps<EffectNodeData>) {
  const { definition, properties } = data;
  const updateNodeParameter = useGraphStore((state) => state.updateNodeParameter);
  const parameterIds = new Set(definition.parameters.map((parameter) => parameter.id));
  const visibleInputs = definition.inputs.filter((input) => !parameterIds.has(input.id));

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
            {definition.parameters.map((parameter) => {
              const value = properties[parameter.id] ?? parameter.defaultValue;

              return (
                <label className="parameter-row nodrag nopan" key={parameter.id}>
                  <div className="parameter-label-row">
                    <span>{parameter.label}</span>
                    <span className="parameter-value">
                      {value.toFixed(parameter.step < 1 ? 2 : 0)}
                      {parameter.unit ? ` ${parameter.unit}` : ""}
                    </span>
                  </div>
                  <input
                    className="parameter-slider nodrag nopan"
                    draggable={false}
                    min={parameter.min}
                    max={parameter.max}
                    step={parameter.step}
                    type="range"
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
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default memo(EffectNode);
