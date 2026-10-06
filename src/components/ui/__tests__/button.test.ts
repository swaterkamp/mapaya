import { createElement } from "react"
import { render, screen } from "@testing-library/react"
import { Button } from "@/components/ui/button"

test("renders a button", () => {
  render(createElement(Button, null, "Save"))
  expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()
})
