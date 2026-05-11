import { describe, it, expect } from "vitest";
import { parseJson } from "./ai-meta";

describe("parseJson", () => {
  it("parses a valid JSON object", () => {
    const raw = '{"description":"A concise one-sentence summary of the document content.","tags":["resume","cv"]}';
    const r = parseJson(raw);
    expect(r).not.toBeNull();
    expect(r?.description).toBe("A concise one-sentence summary of the document content.");
    expect(r?.tags).toEqual(["resume", "cv"]);
  });

  it("strips a ```json fenced block", () => {
    const raw = '```json\n{"description":"A short summary that is long enough to pass the gate.","tags":["report"]}\n```';
    const r = parseJson(raw);
    expect(r?.description).toBe("A short summary that is long enough to pass the gate.");
    expect(r?.tags).toEqual(["report"]);
  });

  it("strips a bare ``` fenced block", () => {
    const raw = '```\n{"description":"A short summary that is long enough.","tags":["invoice"]}\n```';
    const r = parseJson(raw);
    expect(r?.tags).toEqual(["invoice"]);
  });

  it("extracts JSON from prose preamble", () => {
    const raw = 'Here is the metadata:\n{"description":"A short summary that is long enough.","tags":["letter"]}\nDone.';
    const r = parseJson(raw);
    expect(r?.tags).toEqual(["letter"]);
  });

  it("filters non-allowlisted tags", () => {
    const raw = '{"description":"A short summary that is long enough.","tags":["resume","banana","invoice","spaceship"]}';
    const r = parseJson(raw);
    expect(r?.tags).toEqual(["resume", "invoice"]);
  });

  it("normalizes tag casing and dedupes", () => {
    const raw = '{"description":"A short summary that is long enough.","tags":["RESUME","Resume","invoice"]}';
    const r = parseJson(raw);
    expect(r?.tags).toEqual(["resume", "invoice"]);
  });

  it("caps tags at 5", () => {
    const raw = '{"description":"A short summary that is long enough.","tags":["resume","cv","invoice","letter","deck","brief","report"]}';
    const r = parseJson(raw);
    expect(r?.tags.length).toBe(5);
  });

  it("clips description to 140 chars with ellipsis", () => {
    const long = "a".repeat(200);
    const raw = `{"description":"${long}","tags":["resume"]}`;
    const r = parseJson(raw);
    expect(r?.description.length).toBeLessThanOrEqual(140);
    expect(r?.description.endsWith("…")).toBe(true);
  });

  it("strips Description: prefix", () => {
    const raw = '{"description":"Description: A short summary that is long enough.","tags":["resume"]}';
    const r = parseJson(raw);
    expect(r?.description.startsWith("Description:")).toBe(false);
  });

  it("returns null for description shorter than 10 chars", () => {
    const raw = '{"description":"too sml","tags":["resume"]}';
    expect(parseJson(raw)).toBeNull();
  });

  it("returns null for missing description", () => {
    const raw = '{"tags":["resume"]}';
    expect(parseJson(raw)).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(parseJson("not json at all")).toBeNull();
    expect(parseJson("{description: missing quotes}")).toBeNull();
  });

  it("filters non-string tags", () => {
    const raw = '{"description":"A short summary that is long enough.","tags":["resume",42,null,"invoice"]}';
    const r = parseJson(raw);
    expect(r?.tags).toEqual(["resume", "invoice"]);
  });

  it("handles tags as non-array gracefully", () => {
    const raw = '{"description":"A short summary that is long enough.","tags":"resume,cv"}';
    const r = parseJson(raw);
    expect(r?.tags).toEqual([]);
  });
});
