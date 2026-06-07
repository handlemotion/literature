import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isLiteratureEditShortcut } from "./shortcut.js";

function keyEvent(overrides: Partial<KeyboardEvent> & { code?: string }): KeyboardEvent {
  return {
    altKey: false,
    shiftKey: false,
    metaKey: false,
    ctrlKey: false,
    repeat: false,
    code: "KeyL",
    key: "l",
    ...overrides,
  } as KeyboardEvent;
}

describe("isLiteratureEditShortcut", () => {
  it("matches Alt+Shift+L by physical key code", () => {
    assert.equal(
      isLiteratureEditShortcut(
        keyEvent({ altKey: true, shiftKey: true, code: "KeyL", key: "Ł" }),
      ),
      true,
    );
  });

  it("rejects missing modifiers", () => {
    assert.equal(isLiteratureEditShortcut(keyEvent({ shiftKey: true })), false);
    assert.equal(isLiteratureEditShortcut(keyEvent({ altKey: true })), false);
  });

  it("rejects Cmd/Ctrl chord", () => {
    assert.equal(
      isLiteratureEditShortcut(keyEvent({ altKey: true, shiftKey: true, metaKey: true })),
      false,
    );
  });
});
