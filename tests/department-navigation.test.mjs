import assert from "node:assert/strict";
import { resolveActiveDepartment } from "../lib/data/active-department.ts";

const departments = [
  ["phones-tablets", "Phones & Tablets"],
  ["computing", "Computers & Accessories"],
  ["electronics", "TV, Audio & Smart Home"],
  ["fashion", "Fashion"],
  ["home-kitchen", "Home & Kitchen"],
  ["beauty", "Beauty & Personal Care"],
  ["groceries", "Groceries & Food Cupboard"],
  ["baby-kids", "Baby, Kids & Toys"],
].map(([slug, name]) => ({ id: slug, slug, name, description: null, parentId: null }));
const categories = [
  ...departments,
  { id: "phones-cases", slug: "cases", name: "Cases", description: null, parentId: "phones-tablets" },
];

for (const department of departments) {
  assert.equal(resolveActiveDepartment("/products", `?category=${department.slug}`, categories), department.slug,
    `${department.name} should be active for its category URL`);
}

assert.equal(resolveActiveDepartment("/products", "?deals=1", categories), "deals", "Deals should be active only for its URL");
assert.equal(resolveActiveDepartment("/products", "", categories), null, "No department should be active by default");
assert.equal(resolveActiveDepartment("/products", "?category=cases", categories), "phones-tablets", "A child category should activate its parent department");
assert.equal(resolveActiveDepartment("/account", "?deals=1", categories), null, "Department state should not leak to other pages");

console.log(`PASS active state resolves for Deals and all ${departments.length} departments, with no default department.`);
