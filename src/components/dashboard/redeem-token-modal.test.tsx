import { render, screen, fireEvent, act } from "@testing-library/react";
import { RedeemTokenModal } from "./redeem-token-modal";
import { vi } from "vitest";

describe("RedeemTokenModal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders QR step when open", () => {
    render(
      <RedeemTokenModal
        isOpen={true}
        onClose={() => {}}
        tokenCode="AB12CD"
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Redeem Time Token")).toBeInTheDocument();
    expect(screen.getByText("AB12CD")).toBeInTheDocument();
    expect(screen.getByText("Code expires in 5:00")).toBeInTheDocument();
  });

  it("returns an empty result when closed", () => {
    const { container } = render(
      <RedeemTokenModal
        isOpen={false}
        onClose={() => {}}
        tokenCode="AB12CD"
      />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Redeem Time Token")).not.toBeInTheDocument();
    expect(screen.queryByText("AB12CD")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copy short code" }),
    ).not.toBeInTheDocument();
  });

  it("moves from the closed empty result to the normal QR path when reopened", () => {
    const { container, rerender } = render(
      <RedeemTokenModal
        isOpen={false}
        onClose={() => {}}
        tokenCode="ZX90YY"
      />,
    );

    expect(container).toBeEmptyDOMElement();

    rerender(
      <RedeemTokenModal
        isOpen={true}
        onClose={() => {}}
        tokenCode="ZX90YY"
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Redeem Time Token")).toBeInTheDocument();
    expect(screen.getByText("ZX90YY")).toBeInTheDocument();
    expect(screen.getByText("Code expires in 5:00")).toBeInTheDocument();
  });

  it("renders the open state deterministically for an empty token code boundary", () => {
    render(
      <RedeemTokenModal isOpen={true} onClose={() => {}} tokenCode="" />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Redeem Time Token")).toBeInTheDocument();
    expect(screen.getByText("Short Code")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy short code" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("QR Code for redemption"),
    ).toBeInTheDocument();
  });

  it("ignores Escape while closed", () => {
    const onClose = vi.fn();

    const { container } = render(
      <RedeemTokenModal
        isOpen={false}
        onClose={onClose}
        tokenCode="AB12CD"
      />,
    );

    fireEvent.keyDown(window, { key: "Escape" });

    expect(container).toBeEmptyDOMElement();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <RedeemTokenModal
        isOpen={true}
        onClose={onClose}
        tokenCode="AB12CD"
      />,
    );
    fireEvent.click(screen.getByLabelText("Close modal dialog"));
    expect(onClose).toHaveBeenCalled();
  });

  it("simulates supplier scan and moves to success state", async () => {
    render(
      <RedeemTokenModal
        isOpen={true}
        onClose={() => {}}
        tokenCode="AB12CD"
      />,
    );
    fireEvent.click(screen.getByText("Simulate Supplier Scan"));

    expect(screen.getByText("Waiting for Supplier")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText("Token Redeemed!")).toBeInTheDocument();

    // Test the done button
    const onClose = vi.fn();
    render(
      <RedeemTokenModal
        isOpen={true}
        onClose={onClose}
        tokenCode="AB12CD"
      />,
    );
    // simulate again with new props to check onClose
    fireEvent.click(screen.getAllByText("Simulate Supplier Scan")[1]);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.click(screen.getAllByText("Done")[1]);
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on ESC key", () => {
    const onClose = vi.fn();
    render(
      <RedeemTokenModal
        isOpen={true}
        onClose={onClose}
        tokenCode="AB12CD"
      />,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("copies token code when copy button is clicked", async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
    render(
      <RedeemTokenModal
        isOpen={true}
        onClose={() => {}}
        tokenCode="AB12CD"
      />,
    );

    const copyButton = screen.getByLabelText("Copy short code");
    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("AB12CD");
  });
});
