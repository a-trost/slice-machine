const fs = require("fs");
const path = require("path");
const consola = require("consola");

const tests = require("./tests");

const { expectConfig } = require("../expect");

const strUtils = require("../utils/str");
const fsUtils = require("../utils/fs");

const { SM_FILE } = require("../consts");

function pathToLib(config) {
  const p = path.join(process.cwd(), config.pathToLibrary || "./");
  tests.pathHasType(p, "file", `Given path to library "${p}" does not exist`);
  return p;
}

function pathToSlices(config, toLib) {
  const p = path.join(toLib, config.slicesFolder || "slices");
  tests.pathHasType(
    p,
    "directory",
    `Given path to slices folder "${p}" does not exist`
  );
  return p;
}

function readConfig(p) {
  try {
    const file = JSON.parse(fs.readFileSync(p));
    expectConfig(file);
    return file;
  } catch (e) {
    consola.error("[slice-machine/readConfig] Error while reading config.");
    consola.error(e);
  }
}

function getSliceType(sliceName) {
  tests.isSliceName(sliceName);
  return strUtils.snakelize(sliceName);
}

function fetchSliceDefinitions(p) {
  try {
    const folders = fsUtils.getDirectories(p);

    if (!folders.length) {
      throw new Error("[Reason] Slices folder is empty.");
    }

    const slices = {};
    folders.forEach((p) => {
      const sliceName = p.split("/").pop();

      const { model } = tests.isSliceFolder(p);

      slices[getSliceType(sliceName)] = model;
    });

    return slices;
  } catch (e) {
    consola.error(
      "[slice-machine/fetchSliceDefinitions] Error while fetching slices."
    );
    consola.error(e);
  }
}

function writeSmFile(slices) {
  try {
    fs.writeFileSync(path.join(process.cwd(), SM_FILE), slices);
  } catch (e) {
    throw new Error(
      `[SliceMachine/writeFile] An unexpected error occured while write file "sm.json" to ${process.cwd()}`
    );
  }
}

module.exports = {
  fetchSliceDefinitions,
  pathToLib,
  pathToSlices,
  readConfig,
  writeSmFile,
};
