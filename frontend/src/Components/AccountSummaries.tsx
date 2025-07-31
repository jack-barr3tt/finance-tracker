import { Card } from "flowbite-react"
import { useGetUserByIdSummaryAccounts } from "../API/queries"
import { useAsyncMemo } from "../Hooks/useAsyncMemo"
import { useUser } from "../Hooks/useUser"

export default function AccountSummaries() {
  const { userId, decrypt } = useUser()

  const { data: encAccountSummaries } = useGetUserByIdSummaryAccounts({
    path: { id: userId },
  })
  const accountSummaries = useAsyncMemo(
    async () =>
      encAccountSummaries
        ? Promise.all(
            encAccountSummaries.accounts.map(async (acc) => ({
              ...acc,
              account: {
                ...acc.account,
                name: await decrypt(acc.account.name),
              },
            }))
          )
        : null,
    [encAccountSummaries, decrypt]
  )

  return (
    <>
      <h2 className="text-2xl font-medium">Accounts</h2>
      {accountSummaries?.length === 0 ? (
        <p className="text-gray-500">No accounts found</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:flex 2xl:flex-wrap">
            {accountSummaries?.map((account) => (
              <Card>
                <div className="grid grid-cols-2 gap-2 -m-2 auto-cols-auto md:m-0">
                  <h1 className="order-3 font-medium md:order-1">{account.account.name}</h1>
                  <h2 className="font-light">{account.account.bank.name}</h2>
                  <p className="order-first col-span-1 row-span-2 text-3xl md:text-4xl md:order-3 md:col-span-2 md:row-span-1">
                    {account.balance.toLocaleString("en-GB", {
                      style: "currency",
                      currency: "GBP",
                    })}
                  </p>
                </div>
              </Card>
            ))}

            <div className="flex flex-row items-center justify-start">
              <Card>
                <div className="flex flex-row items-center gap-4 text-2xl md:text-3xl">
                  <h1 className="font-medium">Total:</h1>
                  <p>
                    {encAccountSummaries?.total.toLocaleString("en-GB", {
                      style: "currency",
                      currency: "GBP",
                    })}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  )
}
