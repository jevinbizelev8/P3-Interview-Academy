import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../utils/test-utils";
import userEvent from "@testing-library/user-event";
import SignupForm from "@/components/SignupForm";

describe("SignupForm", () => {
  it("shows a validation error when passwords do not match", async () => {
    const user = userEvent.setup();

    render(<SignupForm onSuccess={vi.fn()} onSwitchToLogin={vi.fn()} />);

    await user.type(screen.getByTestId("input-firstname"), "Ada");
    await user.type(screen.getByTestId("input-lastname"), "Lovelace");
    await user.type(screen.getByTestId("input-email"), "ada@example.com");
    await user.type(screen.getByTestId("input-password"), "securepw");
    await user.type(screen.getByTestId("input-confirm-password"), "differentpw");

    await user.click(screen.getByTestId("button-signup"));

    expect(
      screen.getByText(/passwords do not match/i)
    ).toBeInTheDocument();
  });

  it("lets users toggle back to the login view", async () => {
    const onSwitch = vi.fn();
    const user = userEvent.setup();

    render(<SignupForm onSuccess={vi.fn()} onSwitchToLogin={onSwitch} />);

    await user.click(screen.getByTestId("link-login"));

    expect(onSwitch).toHaveBeenCalled();
  });
});