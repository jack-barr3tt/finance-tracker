import { UserProvider } from "./Hooks/useUser"
import Router from "./Router"
import { client } from "./API/requests"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createTheme, ThemeProvider } from "flowbite-react"
import Cookies from "js-cookie"
import { Toaster } from "sonner"
import { DataProvider } from "./Hooks/useData"

client.setConfig({
  baseUrl: import.meta.env.VITE_BACKEND_URL,
  throwOnError: true,
})

client.interceptors.request.use((config) => {
  const accessToken = Cookies.get("access_token")
  if (accessToken) config.headers.append("Authorization", `Bearer ${accessToken}`)
  return config
})

const queryClient = new QueryClient()

const theme = createTheme({
  navbar: {
    root: {
      rounded: {
        on: "rounded-lg",
      },
    },
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <DataProvider>
            <Router />
          </DataProvider>
          <Toaster richColors closeButton position="bottom-right" />
        </UserProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
