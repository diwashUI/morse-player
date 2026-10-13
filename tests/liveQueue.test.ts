import { describe, expect, it } from "vitest";
import { newWords, splitWords, WordQueue } from "../lib/liveQueue";

describe("splitWords", () => {
  it("splits on whitespace and drops empties", () => {
    expect(splitWords("  hello   world\n")).toEqual(["hello", "world"]);
  });
  it("returns [] for blank input", () => {
    expect(splitWords("   ")).toEqual([]);
  });
});

describe("newWords", () => {
  it("returns only words past the consumed count", () => {
    const r = newWords("hello world", 1);
    expect(r.words).toEqual(["world"]);
    expect(r.consumed).toBe(2);
  });
  it("returns nothing new when nothing arrived", () => {
    const r = newWords("hello world", 2);
    expect(r.words).toEqual([]);
    expect(r.consumed).toBe(2);
  });
  it("restarts from zero when the transcript shrank (reset)", () => {
    const r = newWords("hi", 5);
    expect(r.words).toEqual(["hi"]);
    expect(r.consumed).toBe(0);
  });
  it("handles a fresh transcript", () => {
    const r = newWords("one two three", 0);
    expect(r.words).toEqual(["one", "two", "three"]);
    expect(r.consumed).toBe(3);
  });
});

describe("WordQueue", () => {
  it("is FIFO", () => {
    const q = new WordQueue();
    q.push("a");
    q.push("b");
    expect(q.shift()).toBe("a");
    expect(q.shift()).toBe("b");
    expect(q.shift()).toBeUndefined();
  });
  it("tracks size and clears", () => {
    const q = new WordQueue();
    expect(q.size).toBe(0);
    q.push("x");
    q.push("y");
    expect(q.size).toBe(2);
    expect(q.peek()).toBe("x");
    q.clear();
    expect(q.size).toBe(0);
    expect(q.peek()).toBeUndefined();
  });
  it("ignores empty pushes", () => {
    const q = new WordQueue();
    q.push("");
    expect(q.size).toBe(0);
  });
});
