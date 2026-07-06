// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { renderText, Empty, IconBtn, Chips, ThemeToggle } from "./core";
import { Bell } from "lucide-react";

afterEach(cleanup);

describe("renderText", () => {
  it("renders plain text untouched", () => {
    render(<div>{renderText("გამარჯობა მეგობარო", null, null)}</div>);
    expect(screen.getByText("გამარჯობა მეგობარო")).toBeInTheDocument();
  });

  it("makes a hashtag clickable and calls onTag with the tag stripped of #", () => {
    const onTag = vi.fn();
    render(<div>{renderText("ნახე #მზერა დღეს", onTag, null)}</div>);
    fireEvent.click(screen.getByText("#მზერა"));
    expect(onTag).toHaveBeenCalledWith("მზერა");
  });

  it("makes a mention clickable and calls onMention with the handle stripped of @", () => {
    const onMention = vi.fn();
    render(<div>{renderText("გამარჯობა @nini", null, onMention)}</div>);
    fireEvent.click(screen.getByText("@nini"));
    expect(onMention).toHaveBeenCalledWith("nini");
  });

  it("renders a line break for each newline in the text", () => {
    const { container } = render(<div>{renderText("პირველი\nმეორე", null, null)}</div>);
    expect(container.querySelectorAll("br")).toHaveLength(1);
  });
});

describe("Empty", () => {
  it("renders the icon, title, and optional subtitle", () => {
    render(<Empty icon={Bell} t="ცარიელია" s="აღწერა" />);
    expect(screen.getByText("ცარიელია")).toBeInTheDocument();
    expect(screen.getByText("აღწერა")).toBeInTheDocument();
  });

  it("omits the subtitle element when none is given", () => {
    const { container } = render(<Empty icon={Bell} t="ცარიელია" />);
    expect(container.textContent).toBe("ცარიელია");
  });
});

describe("IconBtn", () => {
  it("fires onClick when pressed", () => {
    const onClick = vi.fn();
    render(<IconBtn onClick={onClick}><Bell /></IconBtn>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });

  it("shows the numeric badge when positive", () => {
    render(<IconBtn badge={3}><Bell /></IconBtn>);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("clamps the badge to 9+ above nine", () => {
    render(<IconBtn badge={15}><Bell /></IconBtn>);
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("shows no badge when zero", () => {
    render(<IconBtn badge={0}><Bell /></IconBtn>);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});

describe("Chips", () => {
  it("renders every item and calls onChange with the clicked one", () => {
    const onChange = vi.fn();
    render(<Chips items={["ტექ", "დიზაინი", "კითხვა"]} value="ტექ" onChange={onChange} />);
    expect(screen.getByText("ტექ")).toBeInTheDocument();
    expect(screen.getByText("დიზაინი")).toBeInTheDocument();
    fireEvent.click(screen.getByText("კითხვა"));
    expect(onChange).toHaveBeenCalledWith("კითხვა");
  });
});

describe("ThemeToggle", () => {
  it("in compact mode, toggles from light to dark on click", () => {
    const setMode = vi.fn();
    render(<ThemeToggle mode="light" setMode={setMode} />);
    fireEvent.click(screen.getByRole("button"));
    expect(setMode).toHaveBeenCalledWith("dark");
  });

  it("in compact mode, toggles from dark to light on click", () => {
    const setMode = vi.fn();
    render(<ThemeToggle mode="dark" setMode={setMode} />);
    fireEvent.click(screen.getByRole("button"));
    expect(setMode).toHaveBeenCalledWith("light");
  });

  it("in full mode, renders both options and calls setMode with the clicked one", () => {
    const setMode = vi.fn();
    render(<ThemeToggle mode="light" setMode={setMode} full />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[1]);
    expect(setMode).toHaveBeenCalledWith("dark");
  });
});
