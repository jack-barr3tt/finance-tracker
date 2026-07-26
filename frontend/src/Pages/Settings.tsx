import NewAccount from "./Settings/NewAccount"
import ViewAccounts from "./Settings/ViewAccounts"
import ViewCategories from "./Settings/ViewCategories"
import NewCategory from "./Settings/NewCategory"
import EditCategories from "./Settings/EditCategories"
import EditAccount from "./Settings/EditAccount"
import ApplyRules from "../Components/ApplyRules"
import Page from "../Components/Page"

export default function Settings() {
  return (
    <Page title="Settings">
      <NewAccount />
      <NewCategory />
      <EditCategories />
      <EditAccount />

      <h3 className="text-xl font-medium">Accounts</h3>
      <ViewAccounts />

      <div className="mt-4 flex items-center justify-between md:mt-0">
        <h3 className="text-xl font-medium">Categories</h3>
        <ApplyRules />
      </div>
      <ViewCategories />
    </Page>
  )
}
