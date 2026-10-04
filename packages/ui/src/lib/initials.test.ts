import { expect, it } from "vitest";
import { initials } from "./initials";

it("gera iniciais do primeiro e último nome", () => {
  expect(initials("Maria da Silva Souza")).toBe("MS");
  expect(initials("João")).toBe("J");
  expect(initials("  ")).toBe("?");
});
