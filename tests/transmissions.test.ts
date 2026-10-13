import { describe, expect, it } from "vitest";
import {
  addTransmission,
  makeTransmission,
  parseTransmissions,
  removeTransmission,
  serializeTransmissions,
  transmissionShareText,
  type Transmission,
} from "../lib/transmissions";

const tx = (id: string, createdAt: number): Transmission => ({
  id,
  createdAt,
  text: "HI",
  morse: ".... ..",
});

describe("parseTransmissions", () => {
  it("returns [] for null, blank, or garbage", () => {
    expect(parseTransmissions(null)).toEqual([]);
    expect(parseTransmissions("")).toEqual([]);
    expect(parseTransmissions("not json")).toEqual([]);
    expect(parseTransmissions('{"a":1}')).toEqual([]);
  });
  it("drops malformed entries and sorts newest-first", () => {
    const raw = JSON.stringify([tx("a", 100), { bogus: true }, tx("b", 300), tx("c", 200)]);
    expect(parseTransmissions(raw).map((t) => t.id)).toEqual(["b", "c", "a"]);
  });
});

describe("addTransmission", () => {
  it("prepends and de-dupes by id", () => {
    const list = addTransmission([tx("a", 1)], tx("b", 2));
    expect(list.map((t) => t.id)).toEqual(["b", "a"]);
    const again = addTransmission(list, tx("b", 2));
    expect(again.map((t) => t.id)).toEqual(["b", "a"]);
  });
  it("caps the list length", () => {
    const list = addTransmission([tx("a", 1), tx("b", 2)], tx("c", 3), 2);
    expect(list.map((t) => t.id)).toEqual(["c", "a"]);
  });
});

describe("removeTransmission", () => {
  it("removes by id, keeps the rest", () => {
    expect(removeTransmission([tx("a", 1), tx("b", 2)], "a").map((t) => t.id)).toEqual(["b"]);
  });
});

describe("serializeTransmissions", () => {
  it("round-trips through parse", () => {
    const list = [tx("a", 1), tx("b", 2)];
    expect(parseTransmissions(serializeTransmissions(list))).toEqual(
      list.slice().sort((x, y) => y.createdAt - x.createdAt)
    );
  });
});

describe("makeTransmission", () => {
  it("builds a complete transmission", () => {
    const t = makeTransmission("SOS", "... --- ...");
    expect(t.text).toBe("SOS");
    expect(t.morse).toBe("... --- ...");
    expect(typeof t.id).toBe("string");
    expect(t.createdAt).toBeGreaterThan(0);
  });
});

describe("transmissionShareText", () => {
  it("includes text and morse", () => {
    const s = transmissionShareText(tx("a", 1));
    expect(s).toContain('"HI"');
    expect(s).toContain(".... ..");
  });
});
