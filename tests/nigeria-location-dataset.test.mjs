import assert from "node:assert/strict";
import { getCitiesOfState, getStatesOfCountry } from "@countrystatecity/countries";
import { NIGERIAN_STATES } from "../lib/nigeria.ts";

const comparable = (value) => value.toLowerCase().replace(/[^a-z]/g, "");

const sourceStates = await getStatesOfCountry("NG");
assert.equal(NIGERIAN_STATES.length, 37);

for (const { value } of NIGERIAN_STATES) {
  const expectedName = value === "FCT" ? "Abuja Federal Capital Territory" : value;
  const state = sourceStates.find((candidate) => comparable(candidate.name) === comparable(expectedName));
  assert.ok(state, `Dataset is missing ${value}`);
  const cities = await getCitiesOfState("NG", state.iso2);
  assert.ok(cities.length > 0, `Dataset has no city records for ${value}`);
}

console.log("PASS maintained location dataset covers all 36 states and the FCT with city records.");
