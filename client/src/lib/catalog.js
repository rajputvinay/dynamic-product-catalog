export function normalizeCategoryDraft(draft) {
  const attributes = draft.attributeGroups[0].attributes
    .filter((attribute) => attribute.key && attribute.label)
    .map((attribute) => ({
      ...attribute,
      options: attribute.options.filter(Boolean)
    }));

  const contentModel = draft.contentModel.filter((field) => field.key && field.label);

  return {
    name: draft.name,
    description: draft.description,
    attributeGroups: [{ ...draft.attributeGroups[0], attributes }],
    contentModel,
    detailsLayout: [
      ...contentModel.map((field) => ({ section: field.key, title: field.label })),
      { section: "attributes", title: "Specifications" }
    ]
  };
}
