import { UserProvider } from "./Hooks/useUser"
import Router from "./Router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createTheme, ThemeProvider } from "flowbite-react"
import { Toaster } from "sonner"
import { DataProvider } from "./Hooks/useData"

const queryClient = new QueryClient()

const theme = createTheme({
  navbar: {
    root: {
      rounded: {
        on: "rounded-lg",
      },
    },
  },
  button: {
    color: {
      blue: "border border-transparent bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800",
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
