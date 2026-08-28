import { Suspense } from "react"
import { RouterProvider } from "react-router-dom"

import { PageLoader } from "@/components/PageLoader"
import router from "@/router"

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}
