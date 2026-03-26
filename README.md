# Aurora Graph

A drag-and-drop design tool for visual effects, producing ready-to-run UI for HarmonyOS without any coding!


## Architecture
The tool is built in three layers:
## Layer 1: UI
cross-platform UI that allows users to create effect node graphs -- drag and drop, make connections, adjust parameters with slider, etc. The UI is based on ReactFlow and Zustand in Typescript, and the left sidebar is populated from JSON-backed templates at startup.

## Layer 2: Graph Model
This is the "Source of Truth." It maintains the Directed Acyclic Graph (DAG) structure.

- Responsibility: Validating connections, preventing cycles, managing parameter serialization, and handling the "Registry" of available component blocks.

- Data Structure: A flat object keyed by node ID, where each node stores its metadata, type-specific property values, and explicit parent/child connection references.
- Template Source: Preset node templates live as JSON files in `/template` and are loaded through a typed registry module on app startup.
- Export: The canonical DAG is serialized to JSON after structural edits (node add/remove and new connections) for inspection and downstream transpilation.
- UI Projection: ReactFlow node and edge arrays are derived from the canonical DAG rather than being the source of truth.

## Layer 3: Transpiler and Previewer
Translate the JSON nodes and their connections into concrete ETS code that is HarmonyOS-native. The HarmonyOS UI previewer is integrated here to run the ETS code and provide feedback to the designer.
