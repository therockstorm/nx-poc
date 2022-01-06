import { thrw } from "../thrw";

describe(thrw, () => {
  it("should throw Error", () => {
    const exp = new Error("boom");

    expect(() => thrw(exp)).toThrow(exp);
  });

  it("should throw string", () => {
    const exp = "boom";

    expect(() => thrw(exp)).toThrow(exp);
  });
});
