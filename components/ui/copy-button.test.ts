import test from "node:test";
import assert from "node:assert/strict";

import { writeTextToClipboard } from "./copy-button.helpers.ts";

test("writeTextToClipboard forwards full text to clipboard.writeText", async () => {
  let captured = "";
  const clipboard = {
    async writeText(value: string) {
      captured = value;
    },
  };

  const fullContractId = "CABCDEF1234567890XYZWXY12";
  await writeTextToClipboard(fullContractId, clipboard);

  assert.equal(captured, fullContractId);
});
