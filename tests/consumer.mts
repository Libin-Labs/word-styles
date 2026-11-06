import { resolveWordStyles, styleToCss, type WordStyleDefinition } from '@lp-labs/word-styles';
const styles: WordStyleDefinition[] = [
  { id: 'base', properties: { color: 'navy' } },
  { id: 'title', basedOn: 'base', properties: { fontSize: 24 } },
];
const resolved = resolveWordStyles(styles);
console.log(styleToCss(resolved.styles[1].properties));
