import "server-only";
import { getCitiesOfState, getStatesOfCountry } from "@countrystatecity/countries";
import { NIGERIAN_STATES } from "@/lib/nigeria";

function comparable(value: string) {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

/** Returns the maintained CountryStateCity dataset's places for one checkout state. */
export async function getNigerianCities(stateName: string): Promise<string[] | null> {
  if (!NIGERIAN_STATES.some(({ value }) => value === stateName)) return null;

  const states = await getStatesOfCountry("NG");
  const wanted = stateName === "FCT" ? "Abuja Federal Capital Territory" : stateName;
  const state = states.find((candidate) => comparable(candidate.name) === comparable(wanted));
  if (!state) return null;

  const cities = await getCitiesOfState("NG", state.iso2);
  return [...new Set(cities.map(({ name }) => name.trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "en-NG"));
}
