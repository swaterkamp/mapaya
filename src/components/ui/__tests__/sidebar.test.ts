import { createElement } from "react"
import { render, screen } from "@testing-library/react"
import { Sidebar, SidebarContent, SidebarProvider } from "@/components/ui/sidebar"

test("renders sidebar content", () => {
  render(createElement(SidebarProvider, null, createElement(Sidebar, null, createElement(SidebarContent, null, "Navigation"))))
  expect(screen.getByText("Navigation")).toBeInTheDocument()
})
