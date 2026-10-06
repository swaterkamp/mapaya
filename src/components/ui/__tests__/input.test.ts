import { createElement } from "react"
import { render, screen } from "@testing-library/react"
import { Input } from "@/components/ui/input"

test("renders an input", () => {
  render(createElement(Input, { placeholder: "Search" }))
  expect(screen.getByPlaceholderText("Search")).toBeInTheDocument()
})
