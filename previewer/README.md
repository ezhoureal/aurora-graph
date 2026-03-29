# Previewer Workflow

Edit [main.ets](/home/zireael/aurora-graph/previewer/main.ets) and use this folder as a tiny Harmony app wrapper for command-line builds and Previewer runs.

This setup is local to `aurora-graph` and uses the extracted Harmony command-line tools bundle directly. No Koala or Panda setup is required.

## Layout

- `app`: minimal Stage app wrapper used to build the HAP
- `main.ets`: the ArkTS page source that gets synced into the wrapper app

The scripts also accept:

- `DEVECO_TOOLS_HOME`
- `DEVECO_SDK_HOME`
- `OHOS_BASE_SDK_HOME`
- `PREVIEWER_BIN`

Those env vars override the local defaults if you want to point at another install.

## Setup

The setup script downloads the Harmony command-line tools zip if needed and extracts it into `downloads/command-line-tools`.

If both the zip and the extracted CLT are already present, it reuses both and does nothing.

```bash
cd ~/aurora-graph/previewer
npm run setup
```

Optional flags:

- `node ./scripts/install-archive.mjs --force-download`
- `node ./scripts/install-archive.mjs --force-extract`

## Build And Preview

```bash
cd ~/aurora-graph/previewer
npm run build
npm run preview
```

## Notes

- `main.ets` is copied into `app/entry/src/main/ets/pages/Index.ets` before each build.
- The wrapper app is a minimal Stage app based on the repo's Harmony example layout.
- `npm run build` now does two things:
  - builds the unsigned HAP with `assembleHap`
  - builds the dedicated Previewer artifacts with `PreviewBuild`, `previewMode=true`, and `buildRoot=.preview`
- The HAP is written to `app/entry/build/default/outputs/default/entry-default-unsigned.hap`.
- The Previewer-specific artifacts are written under `app/entry/.preview/default/`.
- The `commandline-tools-linux-x64-6.0.1.251.zip` bundle includes `hvigor`, `ohpm`, Previewer, and the HarmonyOS 6.0.1 / API 21 SDK components needed for this workflow.
- The Previewer launcher runs the bundled binary from `sdk/default/openharmony/previewer/common/bin`, adds the required library paths, and stages the real `.preview` outputs before launch.
- The Harmony preview build only works when `previewMode=true` and `buildRoot=.preview` are passed to `hvigor`; invoking `PreviewBuild` without those extra config values leaves the preview outputs incomplete.
- With the current `6.0.1.251` Linux CLT bundle, the remaining blocker is inside the Previewer runtime itself: the Ark runtime logs `Invalid input assetPath` on Linux even when fed the generated `.preview` artifacts.
- A working Java installation must be available on `PATH` for `hvigor` to package the HAP.
