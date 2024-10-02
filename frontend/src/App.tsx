import { UserProvider } from "./Hooks/useUser"
import Router from "./Router"

function App() {
  return (
    <>
      <UserProvider>
        <Router />
      </UserProvider>
    </>
  )
}

export default App
