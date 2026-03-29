import fs from "fs"
import path from "path"
import { execFileSync } from "child_process"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const previewerRoot = path.resolve(__dirname, "..")
const toolsRoot = path.join(previewerRoot, "tools")
const downloadsRoot = path.join(previewerRoot, "downloads")
const generatedRoot = path.join(previewerRoot, ".generated")
const projectRoot = path.join(previewerRoot, "app")
const previewBuildRoot = path.join(projectRoot, "entry", ".preview", "default")
const loaderJsonPath = path.join(previewBuildRoot, "intermediates", "loader", "default", "loader.json")
const resourceBuildPath = path.join(previewBuildRoot, "intermediates", "res", "default")
const abcBuildPath = path.join(previewBuildRoot, "intermediates", "loader_out", "default", "ets")
const pkgContextInfoPath = path.join(previewBuildRoot, "intermediates", "loader", "default", "pkgContextInfo.json")

const signedHap = path.join(projectRoot, "entry", "build", "default", "outputs", "default", "entry-default-signed.hap")
const unsignedHap = path.join(projectRoot, "entry", "build", "default", "outputs", "default", "entry-default-unsigned.hap")
const hapPath = fs.existsSync(signedHap) ? signedHap : unsignedHap

if (!fs.existsSync(hapPath)) {
  console.error("No built HAP found. Run `npm run build` first.")
  process.exit(1)
}

function resolvePreviewerBinary() {
  if (process.env.PREVIEWER_BIN && fs.existsSync(process.env.PREVIEWER_BIN)) {
    return process.env.PREVIEWER_BIN
  }

  const candidates = [
    path.join(downloadsRoot, "command-line-tools", "sdk", "default", "openharmony", "previewer", "common", "bin", "Previewer"),
    path.join(toolsRoot, "previewer", "common", "bin", "Previewer"),
    path.join(toolsRoot, "previewer", "previewer", "common", "bin", "Previewer"),
    path.join(toolsRoot, "command-line-tools", "sdk", "default", "openharmony", "previewer", "common", "bin", "Previewer")
  ]

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null
}

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true })
  return targetPath
}

function ensureCompatLibs(previewerBin) {
  const previewerBinDir = path.dirname(previewerBin)
  const compatDir = ensureDir(path.join(generatedRoot, "previewer-libs"))
  const hmsLibDir = path.join(downloadsRoot, "command-line-tools", "sdk", "default", "hms", "toolchains", "lib")
  const systemZlib = "/lib/x86_64-linux-gnu/libz.so.1"
  const compatZlib = path.join(compatDir, "libshared_libz.so")

  if (!fs.existsSync(path.join(previewerBinDir, "libshared_libz.so")) && !fs.existsSync(compatZlib) && fs.existsSync(systemZlib)) {
    fs.symlinkSync(systemZlib, compatZlib)
  }

  return [
    previewerBinDir,
    path.join(previewerBinDir, "module"),
    hmsLibDir,
    compatDir,
    process.env.LD_LIBRARY_PATH ?? ""
  ].filter((entry) => entry && fs.existsSync(entry)).join(path.delimiter)
}

function ensureAppResourcePath() {
  const appResourceDir = ensureDir(path.join(generatedRoot, "previewer-app-bundle"))
  const apiMockDir = ensureDir(path.join(appResourceDir, "apiMock"))
  const hmsPreviewerRoot = path.join(downloadsRoot, "command-line-tools", "sdk", "default", "hms", "previewer")
  const links = [
    ["modules.abc", path.join(abcBuildPath, "modules.abc")],
    ["sourceMaps.map", path.join(abcBuildPath, "sourceMaps.map")],
    ["module.json", path.join(resourceBuildPath, "module.json")],
    ["pkgContextInfo.json", pkgContextInfoPath],
    ["resources.index", path.join(resourceBuildPath, "resources.index")],
    ["resources", path.join(resourceBuildPath, "resources")]
  ]

  for (const [name, source] of links) {
    const target = path.join(appResourceDir, name)
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true })
    }
    fs.symlinkSync(source, target, fs.statSync(source).isDirectory() ? "dir" : "file")
  }

  const jsMockSource = path.join(hmsPreviewerRoot, "apiMock", "jsMockHmos.abc")
  const jsMockTarget = path.join(apiMockDir, "jsMockHmos.abc")
  if (fs.existsSync(jsMockTarget)) {
    fs.rmSync(jsMockTarget, { recursive: true, force: true })
  }
  if (fs.existsSync(jsMockSource)) {
    fs.symlinkSync(jsMockSource, jsMockTarget)
  }

  fs.writeFileSync(path.join(appResourceDir, "component_collection.txt"), "")
  fs.writeFileSync(path.join(appResourceDir, "mock-config.json"), "{}\n")
  return appResourceDir
}

const previewerBin = resolvePreviewerBinary()
if (!previewerBin) {
  console.error("Previewer binary not found.")
  console.error("Install it under `previewer/tools/previewer`, use the bundled CLT previewer, or set PREVIEWER_BIN=/abs/path/to/Previewer.")
  process.exit(1)
}

const appBundlePath = ensureAppResourcePath()
const args = [
  "-j", appBundlePath,
  "-arp", appBundlePath,
  "-ljPath", loaderJsonPath,
  "-s", "previewer_serg",
  "-gui",
  "-hap", hapPath,
  "-refresh", "region",
  "-cpm", "false",
  "-device", "phone",
  "-shape", "rect",
  "-sd", "160",
  "-or", "432", "936",
  "-cr", "432", "936",
  "-n", "entry",
  "-av", "ACE_2_0",
  "-url", "pages/Index",
  "-pages", "main_pages",
  "-pm", "Stage",
  "-l", "zh_CN",
  "-cm", "light",
  "-o", "portrait"
]

console.log(`Launching Previewer with ${hapPath}`)
execFileSync(previewerBin, args, {
  cwd: path.dirname(previewerBin),
  stdio: "inherit",
  env: {
    ...process.env,
    LD_LIBRARY_PATH: ensureCompatLibs(previewerBin)
  }
})
