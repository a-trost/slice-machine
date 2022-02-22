import { FieldType, Slice } from "../src";
import path from "path";
import PluginMiddleware from "../src";
import * as Dummy from "../src/dummy-plugin";
import fs from "fs";

const StubModel: Slice = {
  id: "my-slice",
  type: "SharedSlice",
  name: "MySlice",
  description: "MySlice",
  variations: [
    {
      id: "default",
      name: "Default",
      docURL: "...",
      version: "sktwi1xtmkfgx8626",
      description: "MySlice",
      primary: {
        title: {
          type: "StructuredText",
          config: {
            single: "heading1",
            label: "Title",
            placeholder: "This is where it all begins...",
          },
        },
        description: {
          type: "StructuredText",
          config: {
            single: "paragraph",
            label: "Description",
            placeholder: "A nice description of your product",
          },
        },
      },
    },
  ],
};

describe("@slicemachine/plugin-middleware", () => {
  describe("register", () => {
    it("should register a node-module", () => {
      const name = "foo";
      const modulePath = path.join(process.cwd(), "node_modules", name);

      jest.doMock(modulePath, () => ({ bar: null }), { virtual: true });

      jest.spyOn(fs, "lstatSync").mockImplementationOnce(
        () =>
          ({
            isSymbolicLink: () => false,
          } as fs.Stats)
      );
      const p = new PluginMiddleware([name], process.cwd());

      expect(p.plugins[name]).toBeDefined();
      expect("bar" in p.plugins[name]).toBeTruthy();
      // expect(p.plugins.foo.bar).toBeNull();
    });

    it("should register a local module", () => {
      const name = "fake-plugin";

      const moduleName = path.join(process.cwd(), name);
      jest.doMock(moduleName, () => ({ bar: null }), { virtual: true });

      const localPath = `./${name}`;

      jest.spyOn(fs, "lstatSync").mockImplementationOnce(
        () =>
          ({
            isSymbolicLink: () => false,
          } as fs.Stats)
      );
      const p = new PluginMiddleware([localPath]);

      expect(p.plugins[localPath]).toBeDefined();
      expect("bar" in p.plugins[localPath]).toBeTruthy();
    });

    // it.skip("linked plugin from node_modules to somewhere else", () => {
    //   expect(false).toBeTruthy()
    // })
  });

  describe("createSlice", () => {
    it("should call the slice method on plugins", () => {
      jest.spyOn(Dummy, "slice");
      jest.spyOn(fs, "lstatSync").mockImplementationOnce(
        () =>
          ({
            isSymbolicLink: () => false,
          } as fs.Stats)
      );

      const sliceName = StubModel.name;
      const p = new PluginMiddleware([Dummy.name]);
      const result = p.createSlice(StubModel as Slice);
      expect(Dummy.slice).toHaveBeenCalled();
      expect(result[0].data).toContain(`const ${sliceName} = () => "foobar"`);
      expect(result[0].data).toContain(`export default ${sliceName}`);
      expect(result[0].filename).toEqual("index.js");
    });
  });

  describe("createStory", () => {
    it("should call the story method on the plugins", () => {
      jest.spyOn(fs, "lstatSync").mockImplementationOnce(
        () =>
          ({
            isSymbolicLink: () => false,
          } as fs.Stats)
      );

      const p = new PluginMiddleware([`./src/dummy-plugin`], process.cwd());
      const result = p.createStory("some/path", "MySlice", []);

      expect(result[0].filename).toEqual("index.story.js");
      expect(result[0].data).toEqual("some story");
    });
  });

  describe("createIndex", () => {
    it("should call the index method on the plugins", () => {
      jest.spyOn(Dummy, "index");
      const p = new PluginMiddleware([Dummy.name]);
      const result = p.createIndex(["foo", "bar", "baz"]);
      expect(Dummy.index).toBeCalled();
      expect(result[0].filename).toEqual("index.js");
      expect(result[0].data).toContain(
        'export {default as foo} from "./foo"\n'
      );
      expect(result[0].data).toContain(
        'export {default as bar} from "./bar"\n'
      );
      expect(result[0].data).toContain('export {default as baz} from "./baz"');
    });
  });

  describe("createSnippet", () => {
    it("should call plugins snippet function", () => {
      jest.spyOn(Dummy, "snippets");
      const p = new PluginMiddleware([Dummy.name]);

      const result = p.createSnippet(
        Dummy.framework,
        FieldType.Text,
        "slice[0].text"
      );
      expect(Dummy.snippets).toBeCalledWith({
        fieldText: "slice[0].text",
        type: "Text",
        useKey: false,
        isRepeatable: false,
      });
      expect(result).toEqual("<div>slice[0].text</div>");
    });

    it("snippets is optional? (maybe cahnge this)", () => {
      const name = "foo";
      jest.doMock("foo", () => ({}), { virtual: true });

      jest.spyOn(fs, "lstatSync").mockImplementationOnce(
        () =>
          ({
            isSymbolicLink: () => false,
          } as fs.Stats)
      );

      const p = new PluginMiddleware([name], process.cwd());
      const result = p.createSnippet(
        "dummy",
        FieldType.Text,
        "slice[0].text",
        true
      );
      expect(p.plugins["foo"]).toBeDefined();
      expect(result).toEqual("");
    });
  });

  describe("#createModel", () => {
    it("should create a default model", () => {
      const plugin = new PluginMiddleware([Dummy.name], process.cwd());
      const result = plugin.createModel("FooBar");
      expect(result).toMatchSnapshot();
    });
  });

  describe("#getSyntaxForFramework", () => {
    it("should return the syntaxt for the plugin", () => {
      const plugin = new PluginMiddleware([Dummy.name], process.cwd());
      const result = plugin.getSyntaxForFramework(Dummy.framework);
      expect(result).toEqual(Dummy.syntax);
    });
  });
});
