import type { ComponentType, ReactElement } from "react"
import {
  createBrowserRouter,
  type ActionFunction,
  type LoaderFunction,
} from "react-router-dom"

import { AppShell } from "@/components/AppShell"
import { RouteError } from "@/components/RouteError"
import { routePathFromFilePath } from "@/lib/routes"

interface PageModule {
  default: ComponentType
  loader?: LoaderFunction
  action?: ActionFunction
  ErrorBoundary?: ComponentType
}

interface AppRoute {
  path?: string
  element?: ReactElement
  loader?: LoaderFunction
  action?: ActionFunction
  errorElement?: ReactElement
  children?: AppRoute[]
  lazy?: () => Promise<{
    element: ReactElement
    loader?: LoaderFunction
    action?: ActionFunction
    errorElement: ReactElement
  }>
}

const pageModules = import.meta.glob<PageModule>("/src/pages/**/[a-z[]*.tsx")

function createRoutesFromPages(): AppRoute[] {
  const pageRoutes: AppRoute[] = []
  const catchAllRoutes: AppRoute[] = []

  for (const [filePath, loadPage] of Object.entries(pageModules)) {
    const path = routePathFromFilePath(filePath)
    const route: AppRoute = {
      path,
      lazy: async () => {
        const page = await loadPage()
        const Page = page.default
        const PageError = page.ErrorBoundary

        return {
          element: <Page />,
          loader: page.loader,
          action: page.action,
          errorElement: PageError ? <PageError /> : <RouteError />,
        }
      },
    }

    if (path === "*") catchAllRoutes.push(route)
    else pageRoutes.push(route)
  }

  return [
    {
      element: <AppShell />,
      errorElement: <RouteError />,
      children: [...pageRoutes, ...catchAllRoutes],
    },
  ]
}

const router = createBrowserRouter(createRoutesFromPages())

export default router
