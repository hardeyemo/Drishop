export type CategoryNode = { id: string; parentId: string | null };

/** Return a category and every descendant id, regardless of tree depth. */
export function categoryDescendantIds(categories: CategoryNode[], categoryId: string): string[] {
  const ids = new Set([categoryId]);
  let frontier = [categoryId];

  while (frontier.length) {
    const next = categories
      .filter((category) => category.parentId && frontier.includes(category.parentId) && !ids.has(category.id))
      .map((category) => category.id);
    next.forEach((id) => ids.add(id));
    frontier = next;
  }

  return [...ids];
}
