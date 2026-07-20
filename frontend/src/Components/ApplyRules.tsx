import { Button } from "flowbite-react"
import { FiRefreshCw } from "react-icons/fi"
import { useUser } from "../Hooks/useUser"
import { decryptTransaction } from "../Security/data"
import { useCallback } from "react"
import { usePatchUserByIdTransactionsByTransactionId } from "../API/queries"
import { getUserByIdTransactions } from "../API/requests"
import { useData } from "../Hooks/useData"

export default function ApplyRules() {
  const { userId, decrypt, encrypt } = useUser()

  const { categories } = useData()

  const { mutateAsync: editTransaction } =
    usePatchUserByIdTransactionsByTransactionId()

  const applyRules = useCallback(async () => {
    const { data: encTransactions } = await getUserByIdTransactions({
      path: { id: userId },
      query: { category_id: "uncategorised", limit: Number.MAX_SAFE_INTEGER },
    })

    const transactions = await Promise.all(
      encTransactions?.transactions.map((t) =>
        decryptTransaction(t, decrypt),
      ) || [],
    )

    for (const transaction of transactions) {
      for (const category of categories || []) {
        for (const rule of category.rules) {
          if (rule.account.id != transaction.account.id) continue

          const regex = new RegExp(rule.rule, "g")

          if (regex.test(transaction.description)) {
            await editTransaction({
              path: { id: userId, transaction_id: transaction.id },
              body: {
                description: await encrypt(
                  rule.description || transaction.description,
                ),
                category_id: category.id,
                account_id: transaction.account.id,
                date: transaction.date,
                amount: transaction.amount,
              },
            })
          }
        }
      }
    }
  }, [categories, decrypt, editTransaction, encrypt, userId])

  return (
    <Button pill color="green" onClick={applyRules}>
      Apply rules <FiRefreshCw className="ml-2" />
    </Button>
  )
}
