import { createElement } from "react"
import { render, screen } from "@testing-library/react"
import { Field, FieldLabel } from "@/components/ui/field"

test("renders a labelled field", () => {
  render(createElement(Field, null, createElement(FieldLabel, { htmlFor: "name" }, "Name"), createElement("input", { id: "name" })))
  expect(screen.getByLabelText("Name")).toBeInTheDocument()
})
