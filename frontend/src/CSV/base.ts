import Papa from "papaparse"
import {
  postUserByIdTransactionsBulk,
  postUserByIdTransactionsBulkDelete,
  postUserByIdTransactionsBulkFinalise,
  TransactionCreateRequest,
} from "../API/requests"

async function hashFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export function parseCSV<T>(
  file: File,
  userId: string,
  handler: (data: T) => TransactionCreateRequest,
  config?: Partial<Papa.ParseLocalConfig<T, File>>
): Promise<string> {
  return new Promise((resolve, reject) => {
    hashFile(file).then((hash) => {
      const requests: Promise<unknown>[] = []

      new Promise((resolve, reject) => {
        Papa.parse(file, {
          chunk: (results: { data: T[] }) => {
            console.log(results)
            requests.push(
              postUserByIdTransactionsBulk({
                path: { id: userId },
                body: {
                  hash,
                  transactions: results.data.map(handler),
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

          if (results.some((result) => result.status === "rejected")) {
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
                resolve("id")
              })
              .catch(reject)
          }
        })
      })
    })
  })
}
