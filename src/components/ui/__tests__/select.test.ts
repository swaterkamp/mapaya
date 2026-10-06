import { createElement } from "react"
import { render, screen } from "@testing-library/react"
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select"

test("renders a select trigger", () => {
  render(createElement(Select, null, createElement(SelectTrigger, null, createElement(SelectValue, { placeholder: "Choose" }))))
  expect(screen.getByRole("combobox")).toBeInTheDocument()
})
