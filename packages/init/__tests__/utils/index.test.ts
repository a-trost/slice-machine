import { expect, test } from "@jest/globals";

import { findArgument } from "../../src/utils";

describe("findArgument", () => {
  test("should send undefined if there is no args", () => {
    const argument = findArgument([], "toto");
    expect(argument).toBeUndefined();
  });
  test("should send the arg value if there is  a match", () => {
    const argument = findArgument(["--base", "wroom.io"], "base");
    expect(argument).toBe("wroom.io");
  });
  test("should send undefined if there is no match", () => {
    const argument = findArgument(["--base", "wroom.io"], "toto");
    expect(argument).toBeUndefined();
  });
  test("repository argument", () => {
    const arg = findArgument(["--repository", "foo-bar"], "repository");
    expect(arg).toEqual("foo-bar");
  });
});
