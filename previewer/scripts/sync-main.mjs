import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const previewerRoot = path.resolve(__dirname, "..")
const sourceFile = path.join(previewerRoot, "main.ets")
const targetFile = path.join(previewerRoot, "app", "entry", "src", "main", "ets", "pages", "Index.ets")

if (!fs.existsSync(sourceFile)) {
  console.error(`Source ETS file not found: ${sourceFile}`)
  process.exit(1)
}

fs.mkdirSync(path.dirname(targetFile), { recursive: true })
fs.copyFileSync(sourceFile, targetFile)
console.log(`Synced ${sourceFile} -> ${targetFile}`)
