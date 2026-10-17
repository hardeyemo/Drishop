import assert from "node:assert/strict";
import { resolveActiveDepartment } from "../lib/data/active-department.ts";
import { categoryDescendantIds } from "../lib/data/category-tree.ts";

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
  ...departments.flatMap((department) => [
    { id: `${department.id}-category`, slug: `${department.slug}-category`, name: `${department.name} category`, description: null, parentId: department.id },
    { id: `${department.id}-subcategory`, slug: `${department.slug}-subcategory`, name: `${department.name} subcategory`, description: null, parentId: `${department.id}-category` },
  ]),
];

for (const department of departments) {
  assert.equal(resolveActiveDepartment("/products", `?category=${department.slug}`, categories), department.slug,
    `${department.name} should be active for its category URL`);
}

assert.equal(resolveActiveDepartment("/products", "?deals=1", categories), "deals", "Deals should be active only for its URL");
assert.equal(resolveActiveDepartment("/products", "", categories), null, "No department should be active by default");
for (const department of departments) {
  const category = categories.find((entry) => entry.id === `${department.id}-category`);
  const subcategory = categories.find((entry) => entry.id === `${department.id}-subcategory`);
  assert.equal(resolveActiveDepartment("/products", `?category=${category.slug}`, categories), department.slug,
    `${department.name} category should activate its parent department`);
  assert.equal(resolveActiveDepartment("/products", `?category=${subcategory.slug}`, categories), department.slug,
    `${department.name} subcategory should activate its parent department`);
  assert.deepEqual(categoryDescendantIds(categories, department.id), [department.id, category.id, subcategory.id],
    `${department.name} listing should include all nested categories`);
  assert.deepEqual(categoryDescendantIds(categories, category.id), [category.id, subcategory.id],
    `${department.name} category listing should include its subcategories`);
}
assert.equal(resolveActiveDepartment("/account", "?deals=1", categories), null, "Department state should not leak to other pages");

console.log(`PASS active state resolves for Deals and all ${departments.length} departments, with no default department.`);
