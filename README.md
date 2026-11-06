# @lp-labs/word-styles

Cycle-safe named word-style inheritance with deterministic CSS output.

## Install

```sh
npm install @lp-labs/word-styles
```

## Quick start

```js
import { resolveWordStyles, styleToCss } from '@lp-labs/word-styles';

const styles = [
  { id: 'base', properties: { color: 'navy' } },
  { id: 'title', basedOn: 'base', properties: { fontSize: 24 } },
];
const resolved = resolveWordStyles(styles);
console.log(styleToCss(resolved.styles[1].properties));
```

## API and type contract

- `WordStyleDefinition` contains a unique safe `id`, optional `basedOn` parent id, and string/finite-number `properties`.
- `resolveWordStyles(definitions)` returns source-order `{ styles, diagnostics }`. Parent properties are applied first, child properties override; missing parents and inheritance cycles produce diagnostics instead of recursion or exceptions.
- `styleToCss(properties)` sorts properties for stable output and converts camelCase keys to kebab-case. It does not emit a selector or stylesheet wrapper.

## Bounds, errors, and supported subset

At most 10,000 styles, 200,000 properties, and 1,000,000 combined property-value characters are accepted; keys and ids are limited to 128 safe characters and string values to 1,024 characters. `TypeError` reports duplicate ids, malformed property records, invalid CSS names/values; `RangeError` reports exceeded bounds. CSS values are restricted to a conservative character set and reject `url`, `expression`, and `javascript`; this is not a full CSS parser or Word's complete style language. Inheritance follows one parent link per style, so work is bounded by the style count.

## Customization and limitations

Adapt application style names and property policy before creating definitions. Add application-specific validation before using the CSS string in a renderer; the package does not resolve selectors, theme tokens, or Word theme/style parts.

## Module formats

ESM, CommonJS, and TypeScript declarations are included. CommonJS: `const api = require('@lp-labs/word-styles')`. There are no runtime or peer dependencies; TypeScript and Prettier are development-only.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
