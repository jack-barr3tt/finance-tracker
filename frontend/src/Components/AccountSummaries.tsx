import { Card } from "flowbite-react"
import { useData } from "../Hooks/useData"
import { formatCurrencyGBP } from "../utils"

export default function AccountSummaries() {
  const { accountSummary } = useData()

  return (
    <>
      <h2 className="text-2xl font-medium">Accounts</h2>
      {accountSummary?.accounts.length === 0 ? (
        <p className="text-gray-500">No accounts found</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:flex 2xl:flex-wrap">
            {accountSummary?.accounts.map((account) => (
              <Card className="h-30">
                <div className="grid grid-cols-2 gap-2 -m-2 auto-cols-auto md:m-0">
                  <h1 className="order-3 font-medium md:order-1">
                    {account.account.name}
                  </h1>
                  <h2 className="font-light">{account.account.bank.name}</h2>
                  <p className="order-first col-span-1 row-span-2 text-3xl md:text-4xl md:order-3 md:col-span-2 md:row-span-1">
                    {formatCurrencyGBP(account.balance)}
                  </p>
                </div>
              </Card>
            ))}

            <div className="flex flex-row items-center justify-start">
              <Card className="h-30">
                <div className="flex flex-row items-center gap-4 text-2xl md:text-3xl">
                  <h1 className="font-medium">Total:</h1>
                  <p>{formatCurrencyGBP(accountSummary?.total ?? 0)}</p>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  )
}
