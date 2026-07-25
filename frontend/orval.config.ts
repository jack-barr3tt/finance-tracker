import { defineConfig } from "orval"

export default defineConfig({
  financeTracker: {
    input: { target: "../backend/schema/openapi.yaml" },
    output: {
      mode: "single",
      target: "src/API/index.ts",
      client: "react-query",
      clean: true,
      prettier: true,
      // @ts-expect-error Orval runtime baseUrl is valid at codegen time
      baseUrl: { runtime: "import.meta.env.VITE_BACKEND_URL" },
      override: {
        // @ts-expect-error Orval flat input option used by generated client
        useFlatInput: true,
        fetch: {
          includeHttpResponseReturnType: false,
        },
        mutator: {
          path: "src/lib/api-mutator.ts",
          name: "customFetch",
        },
        // Operation override keys use Orval's PascalCase operationId (e.g. GetUserIdTransactions).
        // Global useInfiniteQueryParam is required — per-operation useInfiniteQueryParam is not applied.
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
          useInfiniteQueryParam: "cursor",
        },
        operations: {
          GetUserIdTransactions: {
            query: {
              useInfinite: true,
            },
          },
        },
      },
    },
  },
})
