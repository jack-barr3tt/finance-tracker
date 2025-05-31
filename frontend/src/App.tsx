import { UserProvider } from "./Hooks/useUser"
import Router from "./Router"
import { client } from "./API/requests"

client.setConfig({
  baseUrl: import.meta.env.VITE_BACKEND_URL,
  throwOnError: true,
})

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
