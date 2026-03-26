# Aurora Graph

A drag-and-drop design tool for visual effects, producing ready-to-run UI for HarmonyOS without any coding!

<img width="1246" height="828" alt="Screenshot 2026-03-26 at 8 57 36 PM" src="https://github.com/user-attachments/assets/850c7880-6a5f-4b97-8a67-7d70b5cbe063" />


## Architecture
The tool is built in three layers:
## Layer 1: UI
cross-platform UI that allows users to create effect node graphs -- drag and drop, make connections, adjust parameters with slider, etc. The UI is based on ReactFlow and Zustand in Typescript, and the left sidebar is populated from JSON-backed HarmonyOS effect templates at startup.
Effect node parameter controls use type-specific inline layouts so compact editors such as colors and 2D/3D points stay readable inside narrow node cards.

## Layer 2: Graph Model
This is the "Source of Truth." It maintains the Directed Acyclic Graph (DAG) structure.

- Responsibility: Validating connections, preventing cycles, managing parameter serialization, and handling the "Registry" of available component blocks.

- Data Structure: A flat object keyed by node ID, where each node stores its metadata, type-specific property values, and explicit parent/child connection references.
- Template Source: Preset node templates live as JSON files in `/template/ui-effect` and are auto-loaded through a typed registry module on app startup. We use a script to auto-generate these templates from HarmonyOS SDK declaration.
- Template Schema: HarmonyOS effect templates keep only `image` and `mask` ports. Parameter fields still support numeric, boolean, enum, tuple, point, color, and nested object data, while `mask` dependencies are modeled as input ports so users can wire separate mask nodes into effect nodes.
- Export: The canonical DAG is serialized to JSON after structural edits (node add/remove and new connections) for inspection and downstream transpilation.
- UI Projection: ReactFlow node and edge arrays are derived from the canonical DAG rather than being the source of truth.

## Layer 3: Transpiler and Previewer
Translate the JSON nodes and their connections into concrete ETS code that is HarmonyOS-native. The HarmonyOS UI previewer is integrated here to run the ETS code and provide feedback to the designer.


## Development
Run `npm install`.
If your download gets stuck, it's usually a network issue when installing Electron. Try `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ npm install`
Then, refer to `package.json` to run locally.

To generate HarmonyOS uiEffect templates from the SDK declaration file, run:
`node scripts/generate-ui-effect-templates.mjs /path/to/@ohos.graphics.uiEffect.d.ts`
