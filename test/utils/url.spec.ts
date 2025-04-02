import { PrivateKey } from "@ethersphere/bee-js";

import { getIdentifierFromBzzUrl, getIdentifierFromUrl, getPrivateKeyFromIdentifier } from "../../src/utils/url";

describe("url utils tests", () => {
  test("getIdentifierFromBzzUrl should parse valid links", () => {
    expect(
      getIdentifierFromBzzUrl(
        "http://localhost:1633/bzz/36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f/",
      ),
    ).toEqual("36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f/");
    expect(
      getIdentifierFromBzzUrl(
        "http://localhost:1633/bzz/36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f/c/2023/development-updates/July.html",
      ),
    ).toEqual("36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f/c/2023/development-updates/July.html");
  });

  test("getIdentifierFromBzzUrl should NOT parse invalid links", () => {
    expect(getIdentifierFromBzzUrl("ftp://localhost:1633/bzz/123/")).toEqual(undefined);
    expect(getIdentifierFromBzzUrl("http://localhost:1633/bz/<hash>/c/2023/development-updates/July.html")).toEqual(
      undefined,
    );
  });

  test("getIdentifierFromUrl should parse invalid links", () => {
    expect(getIdentifierFromUrl("ftp://localhost:1633/bzz/123/")).toEqual(
      "b2b66ab4c2f414da86500e28171035ed3b996cdad3174d71ea58df57d100473e",
    );
    expect(getIdentifierFromUrl("http://localhost:1633/bz/<hash>/c/2023/development-updates/July.html")).toEqual(
      "42a5c0c5bcbbc53663fe3ad813a7beba75958fa100e5d7995e63ecc4580e710a",
    );
  });

  test("getPrivateKeyFromIdentifier should parse valid links", () => {
    const expectedPrivateKey1 = new PrivateKey("a4cc60ef9f47e8da0efb455707f5726f7913672dce1024386c793efc51739e32");
    expect(
      getPrivateKeyFromIdentifier(
        "http://localhost:1633/bzz/36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f/",
      ),
    ).toEqual(expectedPrivateKey1);

    const expectedPrivateKey2 = new PrivateKey("475e024979365f4b332af2195d82410e0ae3848c223990608e74628ee631d2c5");
    expect(
      getPrivateKeyFromIdentifier(
        "http://localhost:1633/bzz/36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f/c/2023/development-updates/July.html",
      ),
    ).toEqual(expectedPrivateKey2);
  });
});
