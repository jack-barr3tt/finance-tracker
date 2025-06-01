import { UserProvider } from "./Hooks/useUser"
import Router from "./Router"
import { client } from "./API/requests"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createTheme, ThemeProvider } from "flowbite-react"

client.setConfig({
  baseUrl: import.meta.env.VITE_BACKEND_URL,
  throwOnError: true,
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
          <Router />
        </UserProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
