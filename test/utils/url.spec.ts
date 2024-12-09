import { getIdentifierFromUrl } from "../../src/utils/url";

describe("url utils tests", () => {
  test("getIdentifierFromUrl should parse valid links", () => {
    expect(
      getIdentifierFromUrl(
        "http://localhost:1633/bzz/36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f/",
      ),
    ).toEqual("36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f/");
    expect(
      getIdentifierFromUrl(
        "http://localhost:1633/bzz/36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f/c/2023/development-updates/July.html",
      ),
    ).toEqual("36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f/c/2023/development-updates/July.html");
  });

  test("getIdentifierFromUrl shouldn't parse invalid links", () => {
    expect(getIdentifierFromUrl("ftp://localhost:1633/bzz/123/")).toEqual(undefined);
    expect(getIdentifierFromUrl("http://localhost:1633/bz/<hash>/c/2023/development-updates/July.html")).toEqual(
      undefined,
    );
  });
});
