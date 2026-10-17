import type { Category } from "@/lib/types";

export function resolveActiveDepartment(pathname: string, search: string, categories: Category[]): string | null {
  if (pathname !== "/products") return null;
  const params = new URLSearchParams(search);
  if (params.get("deals") === "1") return "deals";
  let category = categories.find((entry) => entry.slug === params.get("category"));
  while (category?.parentId) category = categories.find((entry) => entry.id === category?.parentId);
  return category?.slug ?? null;
}
