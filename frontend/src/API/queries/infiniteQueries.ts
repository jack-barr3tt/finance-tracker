// generated with @7nohe/openapi-react-query-codegen@2.0.0-beta.3 

import { type Options } from "@hey-api/client-fetch";
import { InfiniteData, useInfiniteQuery, UseInfiniteQueryOptions } from "@tanstack/react-query";
import { getUserByIdTransactions } from "../requests/services.gen";
import { GetUserByIdTransactionsData, GetUserByIdTransactionsError } from "../requests/types.gen";
import * as Common from "./common";
export const useGetUserByIdTransactionsInfinite = <TData = InfiniteData<Common.GetUserByIdTransactionsDefaultResponse>, TError = GetUserByIdTransactionsError, TQueryKey extends Array<unknown> = unknown[]>(clientOptions: Options<GetUserByIdTransactionsData, true>, queryKey?: TQueryKey, options?: Omit<UseInfiniteQueryOptions<TData, TError>, "queryKey" | "queryFn">) => useInfiniteQuery({
  queryKey: Common.UseGetUserByIdTransactionsKeyFn(clientOptions, queryKey), queryFn: ({ pageParam }) => getUserByIdTransactions({ ...clientOptions, query: { ...clientOptions.query, cursor: pageParam as string } }).then(response => response.data as TData) as TData, initialPageParam: "0", getNextPageParam: response => (response as {
    cursor?: string;
  }).cursor, ...options
});
