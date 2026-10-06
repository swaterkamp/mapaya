import { createElement } from "react"
import { render, screen } from "@testing-library/react"
import { Card, CardTitle } from "@/components/ui/card"

test("renders card content", () => {
  render(createElement(Card, null, createElement(CardTitle, null, "City")))
  expect(screen.getByText("City")).toBeInTheDocument()
})
