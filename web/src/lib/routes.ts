export function routePathFromFilePath(filePath: string): string {
  let routePath = filePath
    .replace(/^.*\/src\/pages/, "")
    .replace(/\.tsx$/, "")
    .replace(/\/index$/, "")
    .replace(/\[\.{3}([^\]]+)\]/g, "*")
    .replace(/\[([^\]]+)\]/g, ":$1")

  if (routePath === "") routePath = "/"
  if (routePath === "/404" || filePath.includes("[...404]")) routePath = "*"
  return routePath
}
