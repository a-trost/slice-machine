import {
  jest,
  describe,
  afterEach,
  test,
  expect,
  beforeEach,
} from "@jest/globals";
// import * as Core from "@slicemachine/core";
import { configureProject } from "../src/steps";
import type { spinner } from "../src/utils/logs";
import NodeUtils from "@slicemachine/core/build/node-utils";
import Prismic from "@slicemachine/core/build/prismic";
import { Models } from "@slicemachine/core";

type SpinnerReturnType = ReturnType<typeof spinner>;

const startFn = jest.fn<SpinnerReturnType, string[]>();
const successFn = jest.fn<SpinnerReturnType, string[]>();
const failFn = jest.fn<SpinnerReturnType, string[]>();

jest.mock("../src/utils/logs", () => ({
  spinner: () => ({
    start: startFn,
    succeed: successFn,
    fail: failFn,
  }),
}));

jest.mock("@slicemachine/core/build/node-utils", () => {
  // fragile test problem... If I change the core now I have to manage the mocks, we could mock the fs or calls to fs and not have to deal with this issue?
  const actualCore = jest.requireActual(
    "@slicemachine/core/build/node-utils"
  ) as typeof NodeUtils;

  return {
    ...actualCore,
    retrieveManifest: jest.fn<
      NodeUtils.FileContent<Models.Manifest>,
      [{ cwd: string }]
    >(),
    createManifest: jest.fn<
      void,
      [{ cwd: string; manifest: Models.Manifest }]
    >(),
    patchManifest: jest.fn<
      boolean,
      [{ cwd: string; data: Partial<Models.Manifest> }]
    >(),
    addJsonPackageSmScript: jest.fn<boolean, [{ cwd: string }]>(),
    Files: {
      ...actualCore.Files,
      exists: jest.fn<boolean, [pathToFile: string]>(),
      mkdir: jest.fn<
        string | undefined,
        [target: string, option: { recursive: boolean }]
      >(),
    },
  };
});

describe("configure-project", () => {
  void beforeEach(() => {
    jest.spyOn(process, "exit").mockImplementation((number) => number as never);
  });

  void afterEach(() => {
    jest.clearAllMocks();
  });

  const fakeCwd = "./";
  const fakeBase = "https://music.to.my.hears.io" as Prismic.Endpoints.Base;
  const fakeRepository = "testing-repo";
  const fakeFrameworkStats = {
    value: Models.Frameworks.react,
    manuallyAdded: false,
  };

  const retrieveManifestMock = NodeUtils.retrieveManifest as jest.Mock;
  const createManifestMock = NodeUtils.createManifest as jest.Mock;
  const patchManifestMock = NodeUtils.patchManifest as jest.Mock;
  const addJsonPackageSmScriptMock =
    NodeUtils.addJsonPackageSmScript as jest.Mock;

  const { exists, mkdir } = NodeUtils.Files;
  const fileExistsMock = exists as jest.Mock;
  const mkdirMock = mkdir as jest.Mock;

  test("it should create a new manifest if it doesn't exist yet", () => {
    retrieveManifestMock.mockReturnValue({
      exists: false,
      content: null,
    });
    addJsonPackageSmScriptMock.mockReturnValue(true);

    configureProject(fakeCwd, fakeBase, fakeRepository, fakeFrameworkStats, []);

    expect(retrieveManifestMock).toBeCalled();
    expect(createManifestMock).toHaveBeenCalledWith("./", {
      _latest: "0.0.41",
      apiEndpoint: "https://testing-repo.music.to.my.hears.io/api/v2",
      libraries: ["@/slices"],
    });
    expect(patchManifestMock).not.toBeCalled();

    expect(successFn).toHaveBeenCalled();
    expect(failFn).not.toHaveBeenCalled();
  });

  test("it should patch the existing manifest", () => {
    retrieveManifestMock.mockReturnValue({
      exists: true,
      content: {
        framework: Models.Frameworks.react,
      },
    });
    addJsonPackageSmScriptMock.mockReturnValue(true);

    configureProject(fakeCwd, fakeBase, fakeRepository, fakeFrameworkStats, []);

    expect(retrieveManifestMock).toBeCalled();
    expect(patchManifestMock).toHaveBeenCalledWith("./", {
      apiEndpoint: "https://testing-repo.music.to.my.hears.io/api/v2",
      framework: "react",
      libraries: ["@/slices"],
    });

    expect(successFn).toHaveBeenCalled();
    expect(failFn).not.toHaveBeenCalled();
  });

  test("it should patch the existing manifest with external lib", () => {
    retrieveManifestMock.mockReturnValue({
      exists: true,
      content: {
        framework: Models.Frameworks.react,
      },
    });
    addJsonPackageSmScriptMock.mockReturnValue(true);

    configureProject(fakeCwd, fakeBase, fakeRepository, fakeFrameworkStats, [
      "@/material/slices",
    ]);

    expect(retrieveManifestMock).toBeCalled();
    expect(patchManifestMock).toHaveBeenCalledWith("./", {
      apiEndpoint: "https://testing-repo.music.to.my.hears.io/api/v2",
      framework: "react",
      libraries: ["@/slices", "@/material/slices"],
    });

    expect(successFn).toHaveBeenCalled();
    expect(failFn).not.toHaveBeenCalled();
  });

  test("it should fail if retrieve manifest throws", () => {
    retrieveManifestMock.mockImplementation(() => {
      throw new Error("fake error to test the catch");
    });

    // process.exit should throw
    configureProject(fakeCwd, fakeBase, fakeRepository, fakeFrameworkStats, []);

    expect(retrieveManifestMock).toBeCalled();
    expect(createManifestMock).not.toBeCalled();
    expect(patchManifestMock).not.toBeCalled();

    expect(successFn).not.toHaveBeenCalled();
    expect(failFn).toHaveBeenCalled();
  });

  test("it should fail if create or update manifest throws", () => {
    retrieveManifestMock.mockReturnValue({
      exists: false,
      content: null,
    });
    createManifestMock.mockImplementation(() => {
      throw new Error("fake error to test the catch");
    });

    configureProject(fakeCwd, fakeBase, fakeRepository, fakeFrameworkStats, []);

    expect(retrieveManifestMock).toBeCalled();
    expect(createManifestMock).toBeCalled();
    expect(patchManifestMock).not.toBeCalled();

    expect(successFn).not.toHaveBeenCalled();
    expect(failFn).toHaveBeenCalled();
  });

  test("it should fail if add SM script throws", () => {
    retrieveManifestMock.mockReturnValue({
      exists: false,
      content: null,
    });
    createManifestMock.mockReturnValue(null); // we don't care about this void.
    addJsonPackageSmScriptMock.mockImplementation(() => {
      throw new Error("fake error to test the catch");
    });

    configureProject(fakeCwd, fakeBase, fakeRepository, fakeFrameworkStats, []);

    expect(retrieveManifestMock).toBeCalled();
    expect(createManifestMock).toBeCalled();
    expect(patchManifestMock).not.toBeCalled();

    expect(successFn).not.toHaveBeenCalled();
    expect(failFn).toHaveBeenCalled();
  });

  test("it should create a slice folder if it doesnt exists.", () => {
    // situation where the SM.Json doesn't exists.
    retrieveManifestMock.mockReturnValue({
      exists: false,
      content: null,
    });
    addJsonPackageSmScriptMock.mockReturnValue(true);

    // only called to verify if slice folder exists.
    fileExistsMock.mockReturnValue(false);

    configureProject(fakeCwd, fakeBase, fakeRepository, fakeFrameworkStats);

    expect(mkdirMock).toHaveBeenCalled();
  });

  test("it shouldn' create a slice folder if it exists.", () => {
    // situation where the SM.Json doesn't exists.
    retrieveManifestMock.mockReturnValue({
      exists: false,
      content: null,
    });
    addJsonPackageSmScriptMock.mockReturnValue(true);
    // only called to verify if slice folder exists.
    fileExistsMock.mockReturnValue(true);

    configureProject(fakeCwd, fakeBase, fakeRepository, fakeFrameworkStats);

    expect(mkdirMock).not.toHaveBeenCalled();
  });
});
