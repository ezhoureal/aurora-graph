import fs from "fs"
import path from "path"
import { execFileSync } from "child_process"
import { pipeline } from "stream/promises"
import { Readable } from "stream"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const previewerRoot = path.resolve(__dirname, "..")
const downloadsRoot = path.join(previewerRoot, "downloads")

const clt = {
  name: "command-line-tools",
  url: "https://contentcenter-vali-drcn.dbankcdn.cn/pvt_2/DeveloperAlliance_package_901_9/b8/v3/Ul13EWLOTAqR2Aqn82aG7g/commandline-tools-linux-x64-6.0.1.251.zip?HW-CC-KV=V1&HW-CC-Date=20260329T081727Z&HW-CC-Expire=315360000&HW-CC-Sign=A1AF935E9855965754729D5AE23069616DD8882F81FE30066B3684F8A8D7951D",
  archivePath: path.join(downloadsRoot, "commandline-tools-linux-x64-6.0.1.251.zip"),
  destPath: path.join(downloadsRoot, "command-line-tools"),
  markerPath: path.join(downloadsRoot, "command-line-tools", "hvigor", "bin", "hvigorw.js")
}

function usage() {
  console.error(
    "Usage:\n" +
    "  node scripts/install-archive.mjs [--force-download] [--force-extract]\n"
  )
  process.exit(1)
}

const args = process.argv.slice(2)
const forceDownload = args.includes("--force-download")
const forceExtract = args.includes("--force-extract")

if (args.some((arg) => !["--force-download", "--force-extract"].includes(arg))) {
  usage()
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

async function downloadArchive(downloadUrl, outputPath) {
  ensureDir(path.dirname(outputPath))

  if (!forceDownload && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
    console.log(`Using existing download: ${outputPath}`)
    return
  }

  console.log(`Downloading ${downloadUrl}`)
  const response = await fetch(downloadUrl)
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download archive: ${response.status} ${response.statusText}`)
  }

  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(outputPath))
  console.log(`Downloaded -> ${outputPath}`)
}

function extractArchive(inputArchivePath, outputDir) {
  if (inputArchivePath.endsWith(".zip")) {
    execFileSync("unzip", ["-oq", inputArchivePath, "-d", outputDir], { stdio: "inherit" })
    return
  }

  throw new Error(`Unsupported archive type: ${inputArchivePath}`)
}

function flattenSingleSubdir(dir) {
  for (let pass = 0; pass < 3; pass += 1) {
    const entries = fs.readdirSync(dir).filter((entry) => entry !== "." && entry !== "..")
    if (entries.length !== 1) {
      return
    }

    const child = path.join(dir, entries[0])
    if (!fs.statSync(child).isDirectory()) {
      return
    }

    for (const nested of fs.readdirSync(child)) {
      fs.renameSync(path.join(child, nested), path.join(dir, nested))
    }

    fs.rmdirSync(child)
  }
}

async function installClt() {
  await downloadArchive(clt.url, clt.archivePath)

  if (!forceExtract && fs.existsSync(clt.markerPath)) {
    console.log(`Using existing extraction: ${clt.destPath}`)
    return
  }

  fs.rmSync(clt.destPath, { recursive: true, force: true })
  ensureDir(clt.destPath)

  extractArchive(clt.archivePath, clt.destPath)
  flattenSingleSubdir(clt.destPath)
  console.log(`Installed ${clt.archivePath} -> ${clt.destPath}`)
}

await installClt()
