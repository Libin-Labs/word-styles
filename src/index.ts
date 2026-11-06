export type WordStyleProperties = Record<string, string | number>;
export interface WordStyleDefinition {
  id: string;
  basedOn?: string;
  properties: WordStyleProperties;
}
export interface StyleDiagnostic {
  styleId: string;
  code: 'missing-parent' | 'inheritance-cycle';
  relatedId: string;
}
export interface ResolvedWordStyle {
  id: string;
  properties: WordStyleProperties;
}
export interface WordStyleResolution {
  styles: ResolvedWordStyle[];
  diagnostics: StyleDiagnostic[];
}

const safeProperty = /^[a-z][a-zA-Z0-9-]*$/;
const safeValue = /^[\w\s#(),.%+-]+$/;

export function resolveWordStyles(definitions: WordStyleDefinition[]): WordStyleResolution {
  if (!Array.isArray(definitions) || definitions.length > 10_000)
    throw new RangeError('At most 10,000 styles are supported.');
  const byId = new Map<string, WordStyleDefinition>();
  let propertyCount = 0;
  let valueLength = 0;
  for (const style of definitions) {
    if (!style || !/^[\w.-]{1,128}$/.test(style.id) || byId.has(style.id))
      throw new TypeError('Style ids must be unique safe identifiers.');
    if (
      !style.properties ||
      typeof style.properties !== 'object' ||
      Array.isArray(style.properties)
    )
      throw new TypeError('Style properties must be a record.');
    if (
      style.basedOn !== undefined &&
      (typeof style.basedOn !== 'string' || !/^[\w.-]{1,128}$/.test(style.basedOn))
    )
      throw new TypeError('Parent style id must be a safe identifier of at most 128 characters.');
    for (const [key, value] of Object.entries(style.properties)) {
      if (
        !safeProperty.test(key) ||
        key.length > 128 ||
        !['string', 'number'].includes(typeof value) ||
        (typeof value === 'number' && !Number.isFinite(value))
      ) {
        throw new TypeError(`Invalid style property: ${key}`);
      }
      if (typeof value === 'string') {
        valueLength += value.length;
        if (value.length > 1_024 || valueLength > 1_000_000)
          throw new RangeError('Style property values exceed configured bounds.');
      }
      if (++propertyCount > 200_000) throw new RangeError('Style property count exceeds 200,000.');
    }
    byId.set(style.id, style);
  }
  const diagnostics: StyleDiagnostic[] = [];
  const resolved = new Map<string, WordStyleProperties>();
  for (const style of definitions) {
    const chain: WordStyleDefinition[] = [];
    const seen = new Set<string>();
    let current: WordStyleDefinition | undefined = style;
    while (current) {
      if (seen.has(current.id)) {
        diagnostics.push({ styleId: style.id, code: 'inheritance-cycle', relatedId: current.id });
        break;
      }
      seen.add(current.id);
      chain.push(current);
      if (!current.basedOn) break;
      const parent = byId.get(current.basedOn);
      if (!parent) {
        diagnostics.push({ styleId: style.id, code: 'missing-parent', relatedId: current.basedOn });
        break;
      }
      current = parent;
    }
    const properties: WordStyleProperties = {};
    for (const item of chain.reverse()) Object.assign(properties, item.properties);
    resolved.set(style.id, properties);
  }
  return {
    styles: definitions.map((style) => ({
      id: style.id,
      properties: { ...resolved.get(style.id)! },
    })),
    diagnostics,
  };
}

export function styleToCss(properties: WordStyleProperties): string {
  if (!properties || typeof properties !== 'object' || Array.isArray(properties))
    throw new TypeError('Expected style properties.');
  return Object.keys(properties)
    .sort()
    .map((key) => {
      const value = properties[key];
      if (
        !safeProperty.test(key) ||
        !['string', 'number'].includes(typeof value) ||
        (typeof value === 'number' && !Number.isFinite(value))
      ) {
        throw new TypeError(`Invalid CSS property: ${key}`);
      }
      const text = String(value).trim();
      if (!safeValue.test(text) || /url|expression|javascript/i.test(text))
        throw new TypeError(`Unsafe CSS value for ${key}.`);
      return `${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${text}`;
    })
    .join(';');
}
