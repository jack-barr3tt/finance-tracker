import { HR } from "flowbite-react"
import NewAccount from "./Settings/NewAccount"
import ViewAccounts from "./Settings/ViewAccounts"
import ViewCategories from "./Settings/ViewCategories"
import NewCategory from "./Settings/NewCategory"
import EditCategories from "./Settings/EditCategories"

export default function Settings() {
  return (
    <div className="flex flex-col gap-4 px-16">
      <NewAccount />
      <NewCategory />
      <EditCategories />

      <h2 className="text-2xl font-medium">Settings</h2>

      <HR className="my-4" />

      <h3 className="text-xl font-medium">Accounts</h3>
      <ViewAccounts />

      <h3 className="text-xl font-medium">Categories</h3>
      <ViewCategories />
    </div>
  )
}
