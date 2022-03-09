import path from "path";
import moduleAlias from "module-alias";
import { FileSystem } from "@slicemachine/core";

interface PackageWithModuleAliases extends FileSystem.JsonPackage {
  _moduleAliases?: Record<string, string>;
}

const isAPackageHasModuleAliases = (
  jsonPackage: FileSystem.JsonPackage | PackageWithModuleAliases
): jsonPackage is PackageWithModuleAliases => {
  return (jsonPackage as object).hasOwnProperty("_moduleAliases");
};

export function resolveAliases(cwd: string): void {
  const pkg = FileSystem.retrieveJsonPackage(cwd);
  const pkgContent = pkg.content as PackageWithModuleAliases;
  if (!pkgContent || !isAPackageHasModuleAliases(pkgContent)) {
    return;
  }

  const moduleAliases: [string, string][] = Object.entries(
    pkgContent._moduleAliases || {}
  );

  moduleAliases.forEach(([key, value]) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore As the 2.1 typing is not available yet and solve this problem
    moduleAlias.addAlias(key, (fromPath: string) => {
      return path.join(
        path.relative(path.dirname(fromPath), path.join(cwd, value))
      );
    });
  });
}
