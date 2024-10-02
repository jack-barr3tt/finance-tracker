import { generateSchemaTypes } from "@openapi-codegen/typescript";
import { defineConfig } from "@openapi-codegen/cli";
export default defineConfig({
  api: {
    from: {
      relativePath: "../backend/schema/openapi.yaml",
      source: "file",
    },
    outputDir: "./src/api",
    to: async (context) => {
      await generateSchemaTypes(context, {
        filenamePrefix: "api",
      });
    },
  },
});
