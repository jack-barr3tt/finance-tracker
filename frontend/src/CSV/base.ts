import Papa from "papaparse"
import {
  getUserByIdCategories,
  postUserByIdTransactionsBulk,
  postUserByIdTransactionsBulkDelete,
  postUserByIdTransactionsBulkFinalise,
  TransactionBulkResponse,
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
}

export function parseCSV<T>(
  file: File,
  userId: string,
  accountId: string,
  handler: (data: T) => BaseTransactionData,
  config?: Partial<Papa.ParseLocalConfig<T, File>>
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    hashFile(file).then((hash) => {
      getUserByIdCategories({ path: { id: userId } }).then(({ data: categories }) => {
        const requests: Promise<BulkResponse>[] = []

        const applyRule = (
          description: string
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
            chunk: (results: { data: T[] }) => {
              console.log(results)
              requests.push(
                postUserByIdTransactionsBulk({
                  path: { id: userId },
                  body: {
                    hash,
                    transactions: results.data.map((row) => {
                      const data = handler(row)
                      const { description, category_id } = applyRule(data.description)
                      return {
                        date: data.date.toISOString(),
                        amount: data.amount,
                        account_id: accountId,
                        description,
                        category_id,
                      }
                    }),
                  },
                })
              )
            },
            complete: resolve,
            error: reject,
            ...config,
          })
        }).then(() => {
          Promise.allSettled(requests).then((results) => {
            console.log(results)

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
}
