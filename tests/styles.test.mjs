import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveWordStyles, styleToCss } from '../dist/esm/index.js';

test('inherits parent properties and lets child values override', () => {
  const result = resolveWordStyles([
    { id: 'base', properties: { color: 'navy', fontSize: 12 } },
    { id: 'title', basedOn: 'base', properties: { fontSize: 20 } },
  ]);
  assert.deepEqual(result.styles[1].properties, { color: 'navy', fontSize: 20 });
  assert.equal(result.diagnostics.length, 0);
});
test('reports cycles and missing parents without recursion', () => {
  const result = resolveWordStyles([
    { id: 'a', basedOn: 'b', properties: { color: 'red' } },
    { id: 'b', basedOn: 'a', properties: { fontWeight: 'bold' } },
    { id: 'c', basedOn: 'missing', properties: {} },
  ]);
  assert.ok(result.diagnostics.some((issue) => issue.code === 'inheritance-cycle'));
  assert.ok(result.diagnostics.some((issue) => issue.code === 'missing-parent'));
});
test('serializes CSS deterministically and rejects injection-like values', () => {
  assert.equal(styleToCss({ fontSize: 12, color: 'navy' }), 'color:navy;font-size:12');
  assert.throws(() => styleToCss({ background: 'url(javascript:alert(1))' }), TypeError);
});
