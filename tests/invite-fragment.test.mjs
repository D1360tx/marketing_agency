import assert from "node:assert/strict";
import test from "node:test";
import { handleInviteFragment } from "../src/lib/invite-fragment.ts";

function setup(hash, { error = null, session = {}, throws = false } = {}) {
  const calls = [];
  const browser = {
    pathname: "/", hash,
    clearFragment: () => calls.push(["clear"]),
    replace: (path) => calls.push(["replace", path]),
    createAuth: async () => {
      calls.push(["create"]);
      if (throws) throw Error("network");
      return { setSession: async (tokens) => {
        calls.push(["session", tokens]);
        return { data: { session }, error };
      } };
    },
  };
  return { browser, calls, run: () => handleInviteFragment(browser) };
}
const valid = "#access_token=test-access&refresh_token=test-refresh&token_type=bearer&type=invite";

test("legacy invite clears secrets before auth initialization and redirects after session establishment", async () => {
  const x = setup(valid + "&next=https://evil.test");
  assert.equal(await x.run(), true);
  assert.deepEqual(x.calls, [["clear"], ["create"], ["session", { access_token: "test-access", refresh_token: "test-refresh" }], ["replace", "/auth/accept-invite"]]);
});

test("unrelated hashes, other auth flows, and unrelated routes are untouched", async () => {
  for (const hash of ["", "#pricing", valid.replace("type=invite", "type=recovery"), valid.replace("&type=invite", "")]) {
    const x = setup(hash); assert.equal(await x.run(), false); assert.deepEqual(x.calls, []);
  }
  const x = setup(valid); x.browser.pathname = "/app";
  assert.equal(await x.run(), false); assert.deepEqual(x.calls, []);
});

test("incomplete, duplicate, and ambiguous invite credentials are scrubbed without verification", async () => {
  for (const hash of ["#type=invite", "#type=invite&access_token=x", valid + "&access_token=second", valid + "&type=recovery", valid + "&error=denied", valid + "&code=ambiguous", valid.replace("token_type=bearer", "token_type=other")]) {
    const x = setup(hash); assert.equal(await x.run(), true);
    assert.deepEqual(x.calls, [["clear"], ["replace", "/login?error=auth"]]);
  }
});

test("session errors, missing sessions and initialization exceptions never open setup", async () => {
  for (const options of [{ error: {} }, { session: null }, { throws: true }]) {
    const x = setup(valid, options); await x.run();
    assert.deepEqual(x.calls.at(-1), ["replace", "/login?error=auth"]);
  }
});


