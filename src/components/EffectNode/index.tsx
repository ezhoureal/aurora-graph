import { memo } from "react";
import { Handle, type NodeProps, Position } from "reactflow";
import { useGraphStore } from "../../store/useGraphStore";
import { kindToClass } from "./helpers";
import { ParameterEditor } from "./ParameterEditor";
import type { EffectNodeData } from "./types";

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

        <ParameterEditor
          nodeId={id}
          parameters={definition.parameters}
          properties={properties}
          updateNodeParameter={updateNodeParameter}
        />
      </div>
    </article>
  );
}

export default memo(EffectNode);
