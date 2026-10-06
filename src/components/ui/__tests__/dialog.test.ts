import { createElement } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

test("opens from its trigger", async () => {
  render(createElement(Dialog, null, createElement(DialogTrigger, null, "Open"), createElement(DialogContent, null, "Details")))
  await userEvent.setup().click(screen.getByRole("button", { name: "Open" }))
  expect(await screen.findByRole("dialog")).toHaveTextContent("Details")
})
