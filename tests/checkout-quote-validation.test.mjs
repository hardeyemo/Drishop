import assert from "node:assert/strict";
import { consolidateQuoteItems, verifyQuoteResult } from "../lib/checkout/quote-validation.ts";

const variantId = "8f434346-648f-4bc9-8c1e-3f3c7bb25d3b";
const requested = [{ variantId, quantity: 2 }];

function quote(overrides = {}) {
  return {
    lines: [{
      variant_id: variantId,
      product_id: "52a4578a-8f42-4b64-9a3a-3ffcf5012287",
      slug: "sample-product",
      product_name: "Sample product",
      variant_name: null,
      sku: "SAMPLE-1",
      unit_price_kobo: 750_000,
      quantity: 2,
      line_total_kobo: 1_500_000,
      stock: 3,
    }],
    subtotal_kobo: 1_500_000,
    discount_kobo: 0,
    shipping_kobo: 2_500,
    total_kobo: 1_502_500,
    first_order_free_delivery: false,
    ...overrides,
  };
}

const cases = [];
function test(name, run) { cases.push({ name, run }); }

test("accepts a server quote when line price, requested quantity, stock, and totals agree", () => {
  const result = verifyQuoteResult(quote(), requested, true);
  assert.equal(result.reason, null);
  assert.equal(result.quote?.totalKobo, 1_502_500);
});

test("consolidates duplicate variant rows to match the SQL RPC grouping", () => {
  const lines = consolidateQuoteItems([
    { variantId, quantity: 1 },
    { variantId, quantity: 1 },
  ]);
  assert.deepEqual(lines, [{ variantId, quantity: 2 }]);
  assert.equal(verifyQuoteResult(quote(), lines, true).reason, null);
});

test("rejects stock below requested quantity", () => {
  const result = verifyQuoteResult(quote({ lines: [{ ...quote().lines[0], stock: 1 }] }), requested, true);
  assert.equal(result.reason, "line_integrity");
});

test("rejects invalid or inconsistent server prices", () => {
  const zeroPrice = { ...quote().lines[0], unit_price_kobo: 0, line_total_kobo: 0 };
  assert.equal(verifyQuoteResult(quote({ lines: [zeroPrice], subtotal_kobo: 0, total_kobo: 2_500 }), requested, true).reason, "line_integrity");

  const mismatchedTotal = { ...quote().lines[0], unit_price_kobo: 800_000 };
  assert.equal(verifyQuoteResult(quote({ lines: [mismatchedTotal] }), requested, true).reason, "line_integrity");
});

test("rejects totals inconsistent with server lines and delivery", () => {
  assert.equal(verifyQuoteResult(quote({ total_kobo: 1_400_000 }), requested, true).reason, "total_integrity");
  assert.equal(verifyQuoteResult(quote({ subtotal_kobo: 1_400_000 }), requested, true).reason, "subtotal_integrity");
});

test("rejects an outdated RPC response that omits first-order delivery eligibility", () => {
  const outdated = quote();
  delete outdated.first_order_free_delivery;
  assert.equal(verifyQuoteResult(outdated, requested, true).reason, "response_shape");
});

for (const { name, run } of cases) {
  run();
  console.log(`PASS ${name}`);
}
console.log(`Passed ${cases.length} checkout quote tests.`);
