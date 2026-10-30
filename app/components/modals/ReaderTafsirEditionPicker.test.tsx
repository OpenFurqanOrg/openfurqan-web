import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TAFSIR_EDITIONS } from "../../lib/tafsirEditions";
import ReaderTafsirEditionPicker from "./ReaderTafsirEditionPicker";

describe("ReaderTafsirEditionPicker", () => {
  it("chooses the edition that was tapped and closes", () => {
    const onChange = vi.fn();
    const [current, chosen] = TAFSIR_EDITIONS;
    render(<ReaderTafsirEditionPicker editions={TAFSIR_EDITIONS} value={current.id} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /Choose Tafsir edition/ }));
    fireEvent.click(screen.getByRole("radio", { name: chosen.label }));

    expect(onChange).toHaveBeenCalledWith(chosen.id);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
