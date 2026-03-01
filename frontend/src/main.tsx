import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { initThemeMode } from "flowbite-react"
import App from "./App.tsx"
import "./index.css"

initThemeMode()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
