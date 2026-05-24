import { readFile, writeFile } from "node:fs/promises";

const testFile = ".tmp-tests/tests/jsonStorage.test.js";
const source = await readFile(testFile, "utf8");
await writeFile(
  testFile,
  source.replace("../src/utils/jsonStorageCore", "../src/utils/jsonStorageCore.js"),
);
