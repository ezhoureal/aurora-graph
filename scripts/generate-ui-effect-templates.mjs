import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const projectRoot = path.resolve(new URL("..", import.meta.url).pathname);
const defaultInput = "/Users/zireael/interface_sdk-js-master/api/@ohos.graphics.uiEffect.d.ts";
const inputPath = path.resolve(process.argv[2] ?? defaultInput);
const outputDir = path.resolve(projectRoot, "template/ui-effect");

const sourceText = await fs.readFile(inputPath, "utf8");
const sourceFile = ts.createSourceFile(inputPath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

const namespaceDeclaration = sourceFile.statements.find(
  (statement) =>
    ts.isModuleDeclaration(statement) &&
    statement.name.getText(sourceFile) === "uiEffect" &&
    statement.body &&
    ts.isModuleBlock(statement.body),
);

if (!namespaceDeclaration || !namespaceDeclaration.body || !ts.isModuleBlock(namespaceDeclaration.body)) {
  throw new Error("Could not find uiEffect namespace in the provided declaration file.");
}

const interfaceMap = new Map();
const enumMap = new Map();
const classMap = new Map();

for (const statement of namespaceDeclaration.body.statements) {
  if (ts.isInterfaceDeclaration(statement)) {
    interfaceMap.set(statement.name.text, statement);
  }

  if (ts.isEnumDeclaration(statement)) {
    enumMap.set(
      statement.name.text,
      statement.members.map((member) => member.name.getText(sourceFile)),
    );
  }

  if (ts.isClassDeclaration(statement) && statement.name) {
    classMap.set(statement.name.text, statement);
  }
}

for (const statement of sourceFile.statements) {
  if (ts.isInterfaceDeclaration(statement)) {
    interfaceMap.set(statement.name.text, statement);
  }
}

enumMap.set("GradientDirection", [
  "Left",
  "Top",
  "Right",
  "Bottom",
  "LeftTop",
  "LeftBottom",
  "RightTop",
  "RightBottom",
  "None",
]);

const filterInterface = interfaceMap.get("Filter");
const visualEffectInterface = interfaceMap.get("VisualEffect");
const maskClass = classMap.get("Mask");

if (!filterInterface || !visualEffectInterface || !maskClass) {
  throw new Error("Could not find Filter, VisualEffect, and Mask declarations.");
}

await fs.mkdir(outputDir, { recursive: true });
await removePreviouslyGeneratedTemplates(outputDir);

const templates = [
  ...createTemplatesFromMaskClass(maskClass, "mask", "Mask Source", "#f472b6"),
  ...createTemplatesFromInterface(filterInterface, "filter", "Filter", "#38bdf8"),
  ...createTemplatesFromInterface(visualEffectInterface, "effect", "Visual Effect", "#22c55e"),
];

for (const template of templates) {
  const filePath = path.join(outputDir, `${template.type}.json`);
  await fs.writeFile(filePath, `${JSON.stringify(template, null, 2)}\n`, "utf8");
}

console.log(`Generated ${templates.length} uiEffect templates in ${outputDir}`);

function createTemplatesFromInterface(interfaceNode, typePrefix, category, accent) {
  return interfaceNode.members
    .filter((member) => ts.isMethodSignature(member) && member.name && ts.isIdentifier(member.name))
    .map((member) => {
      const maskInputs = member.parameters
        .filter((parameter) => parameter.type && normalizeType(parameter.type.getText(sourceFile)) === "Mask")
        .map((parameter) => ({
          id: parameter.name.getText(sourceFile),
          label: toTitle(parameter.name.getText(sourceFile)),
          kind: "mask",
        }));

      return {
        type: `${typePrefix}.${member.name.text}`,
        label: toTitle(member.name.text),
        category,
        description: getSummary(member) || `${toTitle(member.name.text)} from HarmonyOS uiEffect.`,
        accent,
        inputs: [{ id: "image", label: "Image", kind: "image" }, ...maskInputs],
        outputs: [{ id: "image", label: "Image", kind: "image" }],
        parameters: member.parameters
          .filter((parameter) => !parameter.type || normalizeType(parameter.type.getText(sourceFile)) !== "Mask")
          .map((parameter) =>
            mapParameter(parameter, getParamDescription(member, parameter.name.getText(sourceFile))),
          ),
      };
    });
}

function createTemplatesFromMaskClass(classNode, typePrefix, category, accent) {
  const allowedNames = new Set([
    "createRippleMask",
    "createPixelMapMask",
    "createRadialGradientMask",
    "createWaveGradientMask",
  ]);

  const methodsByName = new Map();

  for (const member of classNode.members
    .filter(
      (member) =>
        ts.isMethodDeclaration(member) &&
        hasStaticKeyword(member) &&
        member.name &&
        ts.isIdentifier(member.name),
    )) {
    const name = member.name.text;

    if (!allowedNames.has(name)) {
      continue;
    }

    const current = methodsByName.get(name);

    if (!current || member.parameters.length > current.parameters.length) {
      methodsByName.set(name, member);
    }
  }

  return [...methodsByName.values()].map((member) => ({
      type: `${typePrefix}.${member.name.text}`,
      label: toTitle(member.name.text.replace(/^create/, "")),
      category,
      description: getSummary(member) || `${toTitle(member.name.text)} from HarmonyOS uiEffect.Mask.`,
      accent,
      inputs: [],
      outputs: [{ id: "mask", label: "Mask", kind: "mask" }],
      parameters: member.parameters.map((parameter) =>
        mapParameter(parameter, getParamDescription(member, parameter.name.getText(sourceFile))),
      ),
    }));
}

function mapParameter(parameter, description) {
  const id = parameter.name.getText(sourceFile);
  const label = toTitle(id);
  const typeText = parameter.type ? normalizeType(parameter.type.getText(sourceFile)) : "unknown";
  const optional = Boolean(parameter.questionToken);
  const base = {
    id,
    label,
    optional,
    ...(description ? { description } : {}),
  };

  if (typeText === "double" || typeText === "int" || typeText === "number") {
    return {
      ...base,
      kind: "number",
      defaultValue: inferNumberDefault(id),
      ...inferNumericBounds(id, description, typeText === "int"),
    };
  }

  if (typeText === "boolean") {
    return {
      ...base,
      kind: "boolean",
      defaultValue: false,
    };
  }

  if (enumMap.has(typeText)) {
    const options = enumMap.get(typeText);
    return {
      ...base,
      kind: "enum",
      options,
      defaultValue: options[0] ?? "",
    };
  }

  if (typeText === "common2D.Point") {
    return {
      ...base,
      kind: "point2d",
      defaultValue: { x: 0, y: 0 },
      shape: "common2D.Point",
    };
  }

  if (typeText === "common2D.Point3d") {
    return {
      ...base,
      kind: "point3d",
      defaultValue: { x: 0, y: 0, z: 0 },
      shape: "common2D.Point3d",
    };
  }

  if (typeText === "Color" || typeText === "common2D.Color") {
    return {
      ...base,
      kind: "color",
      defaultValue: { red: 1, green: 1, blue: 1, alpha: 1 },
      shape: typeText,
    };
  }

  if (typeText === "common2D.Rect") {
    return {
      ...base,
      kind: "object",
      defaultValue: { left: 0, top: 0, right: 0, bottom: 0 },
      shape: "common2D.Rect",
    };
  }

  if (typeText === "image.PixelMap") {
    return {
      ...base,
      kind: "object",
      defaultValue: {},
      shape: "image.PixelMap",
    };
  }

  if (typeText === "Mask") {
    return {
      ...base,
      kind: "mask",
      defaultValue: { factory: "createUseEffectMask", args: [true] },
      shape: "uiEffect.Mask",
    };
  }

  if (/^\[(?:double,?)+\]$/.test(typeText)) {
    return {
      ...base,
      kind: "numberTuple",
      defaultValue: Array.from({ length: typeText.split(",").length }, () => 0),
      shape: typeText,
    };
  }

  if (typeText === "Array<double>") {
    return {
      ...base,
      kind: "numberArray",
      defaultValue: [],
      shape: "Array<double>",
    };
  }

  if (typeText === "Array<common2D.Point>") {
    return {
      ...base,
      kind: "pointArray",
      defaultValue: [],
      shape: "Array<common2D.Point>",
    };
  }

  if (typeText === "Array<[double,double]>") {
    return {
      ...base,
      kind: "tupleArray",
      defaultValue: [],
      shape: "Array<[double, double]>",
    };
  }

  if (typeText === "Array<Color>") {
    return {
      ...base,
      kind: "object",
      defaultValue: [],
      shape: "Array<Color>",
    };
  }

  if (interfaceMap.has(typeText) || typeText === "LinearGradientBlurOptions") {
    return {
      ...base,
      kind: "object",
      defaultValue: buildObjectDefault(typeText),
      shape: typeText,
    };
  }

  return {
    ...base,
    kind: "object",
    defaultValue: null,
    shape: typeText,
  };
}

function buildObjectDefault(interfaceName, seen = new Set()) {
  if (interfaceName === "LinearGradientBlurOptions") {
    return {
      fractionStops: [],
      direction: "Left",
    };
  }

  if (seen.has(interfaceName)) {
    return {};
  }

  const declaration = interfaceMap.get(interfaceName);

  if (!declaration) {
    return {};
  }

  seen.add(interfaceName);

  const fields = declaration.members
    .filter((member) => ts.isPropertySignature(member) && member.type && member.name)
    .map((member) => [
      member.name.getText(sourceFile),
      defaultValueForType(normalizeType(member.type.getText(sourceFile)), seen),
    ]);

  seen.delete(interfaceName);
  return Object.fromEntries(fields);
}

function defaultValueForType(typeText, seen) {
  if (typeText === "double" || typeText === "int" || typeText === "number") {
    return 0;
  }

  if (typeText === "boolean") {
    return false;
  }

  if (enumMap.has(typeText)) {
    return enumMap.get(typeText)[0] ?? "";
  }

  if (typeText === "common2D.Point") {
    return { x: 0, y: 0 };
  }

  if (typeText === "common2D.Point3d") {
    return { x: 0, y: 0, z: 0 };
  }

  if (typeText === "common2D.Rect") {
    return { left: 0, top: 0, right: 0, bottom: 0 };
  }

  if (typeText === "Color" || typeText === "common2D.Color") {
    return { red: 1, green: 1, blue: 1, alpha: 1 };
  }

  if (/^\[(?:double,?)+\]$/.test(typeText)) {
    return Array.from({ length: typeText.split(",").length }, () => 0);
  }

  if (
    typeText === "Array<double>" ||
    typeText === "Array<common2D.Point>" ||
    typeText === "Array<[double,double]>" ||
    typeText === "Array<Color>"
  ) {
    return [];
  }

  if (interfaceMap.has(typeText) || typeText === "LinearGradientBlurOptions") {
    return buildObjectDefault(typeText, seen);
  }

  return null;
}

function hasStaticKeyword(node) {
  return node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword) ?? false;
}

async function removePreviouslyGeneratedTemplates(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }

    if (!/^(filter|effect|mask)\./.test(entry.name)) {
      continue;
    }

    await fs.unlink(path.join(directory, entry.name));
  }
}

function normalizeType(typeText) {
  return typeText.replace(/\s+/g, "").replace(/^\?/, "");
}

function inferNumberDefault(name) {
  if (/count/i.test(name)) {
    return 1;
  }

  return 0;
}

function inferNumericBounds(name, description, integerLike) {
  const text = description ?? "";
  const rangeMatch = text.match(/\[(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\]/);

  if (rangeMatch) {
    return {
      min: Number(rangeMatch[1]),
      max: Number(rangeMatch[2]),
      step: integerLike ? 1 : 0.01,
    };
  }

  const minMaxMatch = text.match(
    /maximum(?:\s+\w+)*\s+is\s+(-?\d+(?:\.\d+)?).*minimum(?:\s+\w+)*\s+is\s+(-?\d+(?:\.\d+)?)/i,
  );

  if (minMaxMatch) {
    return {
      min: Number(minMaxMatch[2]),
      max: Number(minMaxMatch[1]),
      step: integerLike ? 1 : 0.01,
    };
  }

  if (/alpha|progress|degree|fraction|saturation|rate|ratio/i.test(name)) {
    return { min: 0, max: 1, step: 0.01 };
  }

  if (/count/i.test(name)) {
    return { min: 1, max: 8, step: 1 };
  }

  if (/radius|width|height|x|y|z|intensity|factor/i.test(name)) {
    return { min: 0, max: 100, step: integerLike ? 1 : 0.1 };
  }

  return { min: integerLike ? 0 : -1, max: integerLike ? 100 : 1, step: integerLike ? 1 : 0.01 };
}

function getSummary(node) {
  const doc = node.jsDoc?.[0]?.comment;

  if (!doc) {
    return "";
  }

  if (typeof doc === "string") {
    return doc.replace(/\s+/g, " ").trim();
  }

  return doc.map((part) => part.text).join(" ").replace(/\s+/g, " ").trim();
}

function getParamDescription(node, paramName) {
  for (const doc of node.jsDoc ?? []) {
    for (const tag of doc.tags ?? []) {
      if (tag.tagName?.text !== "param" || tag.name?.getText(sourceFile) !== paramName) {
        continue;
      }

      const comment = tag.comment;

      if (!comment) {
        return "";
      }

      if (typeof comment === "string") {
        return comment.replace(/\s+/g, " ").trim();
      }

      return comment.map((part) => part.text).join(" ").replace(/\s+/g, " ").trim();
    }
  }

  return "";
}

function toTitle(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}
