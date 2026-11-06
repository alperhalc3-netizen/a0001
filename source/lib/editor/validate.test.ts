import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseSettings } from "./validate";

const raw = JSON.parse(readFileSync(new URL("../../data/editor-settings.json", import.meta.url), "utf8"));
const published = parseSettings(raw);
assert.equal(published.ok, true);
if (!published.ok) throw new Error("unreachable");
assert.equal(published.settings.newDropSlug, "cop-2");
assert.equal(published.settings.text.newDropLabel, "New Drop");
assert.deepEqual(published.settings.sections, ["hero", "newDrop", "works", "tattoo", "shop", "outro"]);
assert.equal(published.settings.hidden.length, 0);

const dataUrl = parseSettings({
  ...raw,
  newDropImage: "data:image/png;base64,aaaa",
});
assert.equal(dataUrl.ok, false);

const badSchema = parseSettings({ ...raw, schema: 2 });
assert.equal(badSchema.ok, false);

const polluted = parseSettings({ ...raw, sections: ["hero", "hero", "works", "tattoo", "shop", "outro"] });
assert.equal(polluted.ok, false);

const moved = parseSettings({
  ...raw,
  sections: ["newDrop", "hero", "works", "tattoo", "shop", "outro"],
  hidden: ["tattoo"],
});
assert.equal(moved.ok, true);

console.log("editor settings validation ok");
