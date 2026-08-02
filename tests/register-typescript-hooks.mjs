import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      const isRelativeImport =
        specifier.startsWith("./") || specifier.startsWith("../");
      const hasExtension = /\.[a-z0-9]+$/i.test(specifier);

      if (
        error?.code !== "ERR_MODULE_NOT_FOUND" ||
        !isRelativeImport ||
        hasExtension
      ) {
        throw error;
      }

      return nextResolve(`${specifier}.ts`, context);
    }
  },
});
