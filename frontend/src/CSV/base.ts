import { format } from "date-fns"
import Papa from "papaparse"
import {
  getUserByIdCategories,
  postUserByIdTransactionsBulk,
  postUserByIdTransactionsBulkDelete,
  postUserByIdTransactionsBulkFinalise,
  TransactionBulkResponse,
  TransactionCreateRequest,
} from "../API/requests"

async function hashFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

type BulkResponse = {
  data: TransactionBulkResponse | undefined
  error: unknown
}

type BaseTransactionData = {
  date: Date
  amount: number
  description: string
  account_id?: string
}

export function parseCSV<T>(
  file: File,
  userId: string,
  accountId: string,
  encrypt: (text: string) => Promise<string>,
  decrypt: (text: string) => Promise<string>,
  handler: (data: T) => BaseTransactionData | BaseTransactionData[],
  config?: Partial<Papa.ParseLocalConfig<T, File>>
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    hashFile(file).then((hash) => {
      getUserByIdCategories({ path: { id: userId } }).then(({ data: categories }) => {
        Promise.all(
          (categories ?? []).map(async (category) => ({
            ...category,
            rules: await Promise.all(
              category.rules.map(async (rule) => ({
                ...rule,
                rule: rule.rule ? await decrypt(rule.rule) : "",
                description: rule.description ? await decrypt(rule.description) : "",
              }))
            ),
          }))
        ).then((categories) => {
          const requests: Promise<BulkResponse>[] = []

          const applyRule = (
            description: string,
            accountId: string
          ): { description: string; category_id: string | undefined } => {
            for (const category of categories || []) {
              for (const rule of category.rules) {
                if (rule.account.id != accountId) continue

                const regex = new RegExp(rule.rule, "g")

                if (regex.test(description)) {
                  return {
                    description: rule.description || description,
                    category_id: category.id,
                  }
                }
              }
            }

            return { description, category_id: undefined }
          }

          new Promise((resolve, reject) => {
            Papa.parse(file, {
              chunk: async (results: { data: T[] }) => {
                console.log("chunk", results)
                requests.push(
                  (async () =>
                    postUserByIdTransactionsBulk({
                      path: { id: userId },
                      body: {
                        hash,
                        transactions: (await Promise.all(
                          results.data
                            .map((row) => {
                              const data = handler(row)
                              const list = Array.isArray(data) ? data : [data]

                              return list.map(async (data) => {
                                const { description, category_id } = applyRule(
                                  data.description,
                                  data.account_id || accountId
                                )
                                return {
                                  date: format(data.date, "yyyy-MM-dd"),
                                  amount: data.amount,
                                  account_id: data.account_id || accountId,
                                  description: await encrypt(description),
                                  category_id,
                                }
                              })
                            })
                            .flat()
                        )) as TransactionCreateRequest[],
                      },
                    }))()
                )
              },
              complete: resolve,
              error: reject,
              ...config,
            })
          }).then(() => {
            Promise.allSettled(requests).then((results) => {
              console.log(results)

              if (results.length === 0) {
                reject(new Error("No transactions to process"))
                return
              }

              if (
                results.some((result) => result.status === "rejected") ||
                results.some(
                  (result) => (result as PromiseFulfilledResult<BulkResponse>).value.error != null
                )
              ) {
                postUserByIdTransactionsBulkDelete({
                  path: { id: userId },
                  body: {
                    hash,
                    cancel: true,
                  },
                })
                  .then(() => {
                    reject(new Error("Failed to process some transactions"))
                  })
                  .catch(reject)
              } else {
                postUserByIdTransactionsBulkFinalise({
                  path: { id: userId },
                  body: {
                    hash,
                  },
                })
                  .then(() => {
                    resolve(true)
                  })
                  .catch(reject)
              }
            })
          })
        })
      })
    })
  })
}
