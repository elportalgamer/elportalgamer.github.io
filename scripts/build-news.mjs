// scripts/build-news.mjs
import fs from "node:fs/promises";

const FEED = "https://portalgamerok.blogspot.com/feeds/posts/summary?alt=json&max-results=3&orderby=published";
const FALLBACK_IMG = "og.jpg";

function upsize(url, size = 800) {
  if (!url) return FALLBACK_IMG;
  return url
    .replace(/\/s\d+(-c)?\//, `/s${size}/`)
    .replace(/=s\d+(-c)?/, `=s${size}`)
    .replace(/\/w\d+-h\d+(-c)?\//, `/s${size}/`);
}
function stripHtml(html = "") {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function extractImg(html = "") {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : "";
}

const res = await fetch(FEED);
if (!res.ok) throw new Error(`Blogger HTTP ${res.status}`);
const data = await res.json();
const entries = data?.feed?.entry ?? [];

const items = entries.map(e => {
  const rawHtml = e.summary?.$t || e.content?.$t || "";
  const titleRaw = (e.title?.$t || "").trim();
  const title = titleRaw || stripHtml(rawHtml).split(/\s+/).slice(0, 12).join(" ") + "…";
  const url = (e.link || []).find(l => l.rel === "alternate")?.href || "#";
  const date = e.published?.$t || e.updated?.$t || new Date().toISOString();
  const thumbRaw = e["media$thumbnail"]?.url || extractImg(rawHtml) || FALLBACK_IMG;
  const image = upsize(thumbRaw, 800);
  const summary = stripHtml(rawHtml);
  return { title, url, date, summary, image };
});

await fs.writeFile("news.json", JSON.stringify(items, null, 2));
console.log("news.json actualizado con", items.length, "noticias");
