import fs from "fs"
import path from "path"
import { execFileSync } from "child_process"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const previewerRoot = path.resolve(__dirname, "..")
const toolsRoot = path.join(previewerRoot, "tools")
const downloadsRoot = path.join(previewerRoot, "downloads")
const appRoot = path.join(previewerRoot, "app")
const generatedRoot = path.join(previewerRoot, ".generated")
const sdkViewRoot = path.join(generatedRoot, "sdk")

function requirePath(targetPath, label) {
  if (!fs.existsSync(targetPath)) {
    console.error(`${label} not found: ${targetPath}`)
    process.exit(1)
  }
  return targetPath
}

function resolveToolsHome() {
  if (process.env.DEVECO_TOOLS_HOME && fs.existsSync(process.env.DEVECO_TOOLS_HOME)) {
    return process.env.DEVECO_TOOLS_HOME
  }

  const candidates = [
    path.join(downloadsRoot, "command-line-tools"),
    path.join(toolsRoot, "command-line-tools"),
    path.join(toolsRoot, "command-line-tools", "command-line-tools")
  ]

  return requirePath(candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0], "Command line tools")
}

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true })
  return targetPath
}

function writeJson(targetPath, value) {
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`)
}

function replaceWithSymlink(targetPath, sourcePath) {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true })
  }

  fs.symlinkSync(sourcePath, targetPath, "dir")
}

function resolveBundledSdkHome(toolsHome) {
  const candidates = [
    path.join(toolsHome, "sdk", "default", "openharmony"),
    path.join(toolsHome, "command-line-tools", "sdk", "default", "openharmony")
  ]

  return requirePath(candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0], "Harmony SDK")
}

function ensureSdkView(bundledSdkHome) {
  const apiVersion = "21"
  ensureDir(generatedRoot)
  ensureDir(sdkViewRoot)
  const apiRoot = ensureDir(path.join(sdkViewRoot, apiVersion))
  const componentNames = ["toolchains", "ets", "js", "native", "previewer"]
  const sdkPkgPath = path.join(path.dirname(bundledSdkHome), "sdk-pkg.json")

  for (const componentName of componentNames) {
    const sourceDir = requirePath(path.join(bundledSdkHome, componentName), `SDK component ${componentName}`)
    const targetDir = path.join(apiRoot, componentName)
    replaceWithSymlink(targetDir, sourceDir)
  }

  if (fs.existsSync(sdkPkgPath)) {
    const sdkPkg = JSON.parse(fs.readFileSync(sdkPkgPath, "utf8"))
    writeJson(path.join(sdkViewRoot, "sdk-pkg.json"), {
      ...sdkPkg,
      apiVersion
    })
  }

  return apiRoot
}

function pathEntries(toolsHome, bundledSdkHome) {
  const llvmBin = path.join(bundledSdkHome, "native", "llvm", "bin")
  const toolchainBin = path.join(bundledSdkHome, "toolchains")

  return [
    path.join(toolsHome, "bin"),
    path.join(toolsHome, "ohpm", "bin"),
    path.join(toolsHome, "hvigor", "bin"),
    toolchainBin,
    llvmBin,
    process.env.PATH ?? ""
  ].filter(Boolean).join(path.delimiter)
}

const toolsHome = resolveToolsHome()
const bundledSdkHome = resolveBundledSdkHome(toolsHome)
const sdkHome = ensureSdkView(bundledSdkHome)
const hvigorwJs = requirePath(path.join(toolsHome, "hvigor", "bin", "hvigorw.js"), "hvigorw.js")
const ohpmBin = requirePath(path.join(toolsHome, "ohpm", "bin", "ohpm"), "ohpm")

const env = {
  ...process.env,
  DEVECO_TOOLS_HOME: toolsHome,
  DEVECO_SDK_HOME: sdkViewRoot,
  OHOS_BASE_SDK_HOME: sdkViewRoot,
  PATH: pathEntries(toolsHome, bundledSdkHome)
}

function run(binary, args) {
  console.log(`> ${binary} ${args.join(" ")}`)
  execFileSync(binary, args, {
    cwd: appRoot,
    stdio: "inherit",
    env
  })
}

const depsOnly = process.argv.includes("--deps-only")
const previewOnly = process.argv.includes("--preview-only")

run("bash", [ohpmBin, "install", "--all", "--strict_ssl", "false"])

if (depsOnly) {
  process.exit(0)
}

function hvigorArgs(taskName, extraArgs = []) {
  return [
    hvigorwJs,
    "--mode", "module",
    "-p", "module=entry@default",
    "-p", "product=default",
    "-p", "requiredDeviceType=default",
    ...extraArgs,
    "--no-parallel",
    "--no-incremental",
    "--no-daemon",
    taskName
  ]
}

if (!previewOnly) {
  run("node", hvigorArgs("assembleHap"))
}

run("node", hvigorArgs("PreviewBuild", [
  "-p", "previewMode=true",
  "-p", "buildRoot=.preview",
  "-p", "previewer.replace.page=pages/Index",
  "-p", "previewer.replace.srcPath=src/main/ets/pages/Index.ets"
]))
