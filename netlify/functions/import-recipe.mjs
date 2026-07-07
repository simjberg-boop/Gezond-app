// functions-src/import-recipe.mjs
function parseDuration(d) {
  if (!d || typeof d !== "string")
    return null;
  const m = /P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/.exec(d);
  if (!m)
    return null;
  return parseInt(m[1] || 0) * 1440 + parseInt(m[2] || 0) * 60 + parseInt(m[3] || 0) || null;
}
function parseNum(v) {
  if (v == null)
    return null;
  const m = /([\d.,]+)/.exec(String(v));
  return m ? Math.round(parseFloat(m[1].replace(",", "."))) : null;
}
function findRecipe(node) {
  if (!node || typeof node !== "object")
    return null;
  const arr = Array.isArray(node) ? node : node["@graph"] || [node];
  for (const item of arr) {
    if (!item || typeof item !== "object")
      continue;
    const t = item["@type"];
    if (t === "Recipe" || Array.isArray(t) && t.includes("Recipe"))
      return item;
    const deep = findRecipe(item["@graph"] || item.mainEntity);
    if (deep)
      return deep;
  }
  return null;
}
var import_recipe_default = async (req) => {
  const url = new URL(req.url).searchParams.get("url");
  if (!url || !/^https?:\/\//.test(url))
    return Response.json({ ok: false, fout: "Geen geldige link." });
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36", "Accept": "text/html,application/xhtml+xml", "Accept-Language": "nl-NL,nl;q=0.9" } });
    if (!r.ok)
      return Response.json({ ok: false, fout: `De receptsite weigert onze server (code ${r.status}). Grote sites zoals ah.nl blokkeren dit soms. Probeer dezelfde zoekopdracht op leukerecepten.nl, jumbo.com of lekkerensimpel.com.` });
    const html = await r.text();
    let recipe = null;
    for (const m of html.matchAll(/<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
      const raw = m[1].replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, "").trim();
      try {
        recipe = findRecipe(JSON.parse(raw));
      } catch {
      }
      if (recipe)
        break;
    }
    if (!recipe)
      return Response.json({ ok: false, fout: "Deze pagina heeft geen leesbare receptdata. Probeer een link van bijvoorbeeld Leukerecepten, Jumbo of Lekker en Simpel." });
    const stappen = (Array.isArray(recipe.recipeInstructions) ? recipe.recipeInstructions : [recipe.recipeInstructions]).flatMap((i) => {
      if (!i)
        return [];
      if (typeof i === "string")
        return [i];
      if (i.text)
        return [i.text];
      if (Array.isArray(i.itemListElement))
        return i.itemListElement.map((e) => e?.text).filter(Boolean);
      return [];
    }).map((s) => s.replace(/<[^>]+>/g, "").trim()).filter(Boolean);
    const nut = recipe.nutrition || {};
    return Response.json({
      ok: true,
      naam: (recipe.name || "Recept").trim(),
      ing: (recipe.recipeIngredient || []).map((s) => String(s).trim()),
      stappen,
      tijd: parseDuration(recipe.totalTime) || parseDuration(recipe.cookTime) || parseDuration(recipe.prepTime),
      kcal: parseNum(nut.calories),
      eiwit: parseNum(nut.proteinContent),
      porties: parseNum(recipe.recipeYield)
    });
  } catch {
    return Response.json({ ok: false, fout: "De pagina kon niet worden opgehaald. Check de link en probeer opnieuw." });
  }
};
export {
  import_recipe_default as default
};
