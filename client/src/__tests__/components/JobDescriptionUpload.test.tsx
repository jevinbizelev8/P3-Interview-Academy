import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "../utils/test-utils";
import userEvent from "@testing-library/user-event";
import JobDescriptionUpload from "@/components/JobDescriptionUpload";

describe("JobDescriptionUpload", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows empty state when there are no saved job descriptions", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    render(
      <JobDescriptionUpload
        userId="user-123"
        onJobDescriptionSelect={vi.fn()}
      />
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    expect(await screen.findByText(/No job descriptions uploaded yet/i)).toBeInTheDocument();
  });

  it("notifies when an uploaded job description is selected", async () => {
    const jobDescription = {
      id: "jd-1",
      userId: "user-123",
      fileName: "product-manager.pdf",
      fileUrl: "https://example.com/job-description.pdf",
      fileSize: 120_000,
      uploadedAt: new Date("2024-05-01T12:00:00Z"),
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [jobDescription],
    });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <JobDescriptionUpload
        userId="user-123"
        onJobDescriptionSelect={onSelect}
      />
    );

    await waitFor(() =>
      expect(screen.getByText(jobDescription.fileName)).toBeInTheDocument()
    );

    await user.click(screen.getByText(jobDescription.fileName));

    expect(onSelect).toHaveBeenCalledWith(jobDescription);
  });
});