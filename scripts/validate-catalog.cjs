const fs = require("node:fs");
const assert = require("node:assert/strict");

const source = fs.readFileSync("web/app.js", "utf8");
const html = fs.readFileSync("web/index.html", "utf8");
const groups = [...source.matchAll(/\{category:"([^"]+)", count:(\d+), entries:\[([\s\S]*?)\]\}/g)];
assert.equal(groups.length, 6, "Expected six catalog categories");

let total = 0;
const actual = {};
for (const match of groups) {
  const [, category, rawCount, entriesSource] = match;
  const count = Number(rawCount);
  const entries = [...entriesSource.matchAll(/\["[^"]+","[^"]+"\]/g)].length;
  assert.ok(entries > 0, category + " must define base objects");
  assert.equal(count % entries, 0, category + " variants must divide evenly across templates");
  actual[category] = count;
  total += count;
}
assert.deepEqual(actual, {
  Furniture: 320,
  Lighting: 120,
  Decor: 240,
  Plants: 80,
  Architecture: 140,
  Appliances: 100
});
assert.equal(total, 1000, "Catalog must contain exactly 1,000 procedural variants");
assert.match(source, /const finishes = \["Natural oak","Warm walnut","Matte white","Graphite","Soft sage"\]/);
assert.match(source, /const sizes = \["Compact","Standard","Wide","Premium"\]/);
assert.match(source, /const PAGE_SIZE = 48/);
assert.match(html, /id="loadMoreObjects"/);
assert.match(html, /option>Bathroom</);
assert.match(html, /id="catalogRoomFilter"/);
assert.match(source, /https:\/\/api\.polyhaven\.com\/assets\?type=models/);
assert.match(source, /resolution\.every\(value => Number\(value\) >= 4096\)/);
assert.ok(fs.existsSync("index.html"), "Root launcher page must exist");
assert.ok(fs.existsSync("Run-Generator3DROOMS.bat"), "Windows local server launcher must exist");
assert.match(source, /Free 3D/);
console.log("Catalog validation passed: 1,000 procedural variants across 6 categories.");
