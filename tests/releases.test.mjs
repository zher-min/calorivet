import assert from "node:assert/strict";
import test from "node:test";
import { releases } from "../config/releases.ts";

test("release history has one current release and stable unique versions", () => {
  assert.equal(releases[0].version, "v3.11.0");
  assert.equal(releases.filter(release => release.current).length, 1);
  assert.equal(new Set(releases.map(release => release.version)).size, releases.length);
  assert.equal(releases.at(-1)?.version, "v1.0.0");
  assert.ok(releases.every(release => /^v\d+\.\d+\.\d+$/.test(release.version)));
});
