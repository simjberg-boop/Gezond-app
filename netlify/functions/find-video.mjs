// functions-src/find-video.mjs
var find_video_default = async (req) => {
  const q = new URL(req.url).searchParams.get("q");
  if (!q)
    return Response.json({ ids: [] });
  try {
    const r = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Accept-Language": "nl-NL,nl;q=0.9,en;q=0.8" }
    });
    const html = await r.text();
    const seen = /* @__PURE__ */ new Set();
    const ids = [];
    for (const m of html.matchAll(/"videoId":"([\w-]{11})"/g)) {
      if (!seen.has(m[1])) {
        seen.add(m[1]);
        ids.push(m[1]);
      }
      if (ids.length >= 5)
        break;
    }
    return Response.json({ ids });
  } catch {
    return Response.json({ ids: [] });
  }
};
export {
  find_video_default as default
};
