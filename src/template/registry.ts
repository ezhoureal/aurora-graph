import type { TemplateDefinition } from "./schema";

const templateModules = import.meta.glob("../../template/ui-effect/*.json", {
  eager: true,
  import: "default",
}) as Record<string, TemplateDefinition>;

export { type PortKind, type TemplateDefinition, type TemplateParameter } from "./schema";

export const templateItems = Object.values(templateModules).sort((left, right) =>
  left.label.localeCompare(right.label),
);

export const templateByType = Object.fromEntries(
  templateItems.map((item) => [item.type, item]),
) as Record<string, TemplateDefinition>;
