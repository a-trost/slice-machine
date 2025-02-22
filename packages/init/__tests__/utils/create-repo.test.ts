import { describe, expect, test, jest } from "@jest/globals";

import nock from "nock";
import { createRepository } from "../../src/utils/create-repo";
import { stderr, stdout } from "stdout-stderr";
import { Models } from "@slicemachine/core";

describe("createRepository", () => {
  test("when successful it will have called the endpoint and displayed a success message", async () => {
    const domain = "foo-bar";
    const base = "https://prismic.io";
    const framework = Models.Frameworks.svelte;
    const cookies = "prismic-auth=biscuits;";

    nock(base)
      .post("/authentication/newrepository?app=slicemachine")
      .reply(200, { domain });

    stderr.start();
    const createdRepoDomain = await createRepository(
      domain,
      framework,
      cookies,
      base
    );
    stderr.stop();
    expect(createdRepoDomain).toBe(domain);
    expect(stderr.output).toContain(domain);
    expect(stderr.output).toContain("Creating Prismic Repository");
    expect(stderr.output).toContain("We created your new repository");
  });

  test("success without domain in the response", async () => {
    const domain = "foo-bar";
    const base = "https://prismic.io";
    const framework = Models.Frameworks.next;
    const cookies = "prismic-auth=biscuits;";

    nock(base)
      .post("/authentication/newrepository?app=slicemachine")
      .reply(200, {});

    stderr.start();
    const createdRepoDomain = await createRepository(
      domain,
      framework,
      cookies,
      base
    );
    stderr.stop();
    expect(createdRepoDomain).toBe(domain);
    expect(stderr.output).toContain(domain);
    expect(stderr.output).toContain("Creating Prismic Repository");
    expect(stderr.output).toContain("We created your new repository");
  });

  test("when a error code is returned it will inform the user that their was an error", async () => {
    const domain = "foo-bar";
    const base = "https://prismic.io";
    const framework = Models.Frameworks.vanillajs;
    const cookies = "prismic-auth=biscuits;";

    nock(base)
      .post("/authentication/newrepository?app=slicemachine")
      .reply(500, {});

    const fakeExit = jest
      .spyOn(process, "exit")
      .mockImplementationOnce(() => undefined as never);
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    stderr.start();
    stdout.start();
    await createRepository(domain, framework, cookies, base);
    stderr.stop();
    stdout.stop();
    expect(stderr.output).toContain("Error creating repository");
    expect(stdout.output).toContain("Run npx @slicemachine/init again!");
    expect(fakeExit).toHaveBeenCalled();
  });
});
