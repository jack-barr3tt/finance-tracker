import { Card } from "flowbite-react"
import { useData } from "../Hooks/useData"
import { formatCurrencyGBP } from "../utils"

export default function AccountSummaries() {
  const { accountSummary } = useData()

  return (
    <>
      {accountSummary?.accounts.length === 0 ? (
        <p className="text-gray-500">No accounts found</p>
      ) : (
        <>
          <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4">
            {accountSummary?.accounts.map((account) => (
              <Card key={account.account.id} className="h-30">
                <div className="flex flex-col gap-1">
                  <h2 className="truncate text-sm font-light text-gray-600 dark:text-gray-400">
                    {account.account.bank.name}
                  </h2>
                  <h3 className="truncate font-medium">
                    {account.account.name}
                  </h3>
                  <p className="text-3xl md:text-4xl">
                    {formatCurrencyGBP(account.balance)}
                  </p>
                </div>
              </Card>
            ))}

            <Card className="h-30">
              <div className="flex flex-col gap-1">
                <h3 className="text-[2rem] font-light leading-[1.5]">Total</h3>
                <p className="text-3xl md:text-4xl">
                  {formatCurrencyGBP(accountSummary?.total ?? 0)}
                </p>
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  )
}
