import assert from "node:assert/strict";
import test from "node:test";
import { parseSubtitle } from "./subtitleParser.js";

test("parseSubtitle parses UTF-16LE SAMI cues and uses blank sync points as cue endings", () => {
  const sami = `<SAMI>
<BODY>
<SYNC Start=1000><P Class=ENCC><i>Hello</i><br>world
<SYNC Start=2500><P Class=ENCC>&nbsp;
<SYNC Start=4000><P Class=ENCC>Next &amp; final
<SYNC Start=6000><P Class=ENCC>&nbsp;
</BODY>
</SAMI>`;
  const content = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(sami, "utf16le")]);

  const result = parseSubtitle(content);

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.segments, [
    { startTime: 1, endTime: 2.5, text: "Hello\nworld" },
    { startTime: 4, endTime: 6, text: "Next & final" },
  ]);
});

test("parseSubtitle keeps parsing SRT content", () => {
  const result = parseSubtitle(`1
00:00:01,000 --> 00:00:02,500
Hello world`);

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.segments, [{ startTime: 1, endTime: 2.5, text: "Hello world" }]);
});
