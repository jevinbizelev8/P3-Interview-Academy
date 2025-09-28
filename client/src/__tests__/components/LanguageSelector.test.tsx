import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../utils/test-utils";
import LanguageSelector from "@/components/LanguageSelector";

describe("LanguageSelector", () => {
  it("renders the currently selected language", () => {
    render(<LanguageSelector value="en" onValueChange={vi.fn()} />);

    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("shows bilingual guidance when a non-English value is provided", () => {
    render(<LanguageSelector value="" onValueChange={vi.fn()} />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText(/questions shown in both languages/i)).toBeInTheDocument();
  });
});