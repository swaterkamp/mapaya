import { createElement } from "react"
import { render, screen } from "@testing-library/react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

test("renders hover card trigger", () => {
  render(createElement(HoverCard, null, createElement(HoverCardTrigger, null, "Preview"), createElement(HoverCardContent, null, "Details")))
  expect(screen.getByText("Preview")).toBeInTheDocument()
})
