import { expect, test } from "bun:test";
import { beacon } from "./index";

test("beacon", () => {
  expect(beacon()).toBe("beacon");
});
