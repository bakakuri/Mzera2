// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { renderText, Empty, IconBtn, Chips, ThemeToggle, Avatar, FollowBtn, UploadProgress, UploadRing, NewThread, Checkout, EmojiPanel, GroupPost, NewListing, EMOJIS, setME, mergeProfile, t } from "./core";
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

describe("Avatar", () => {
  it("shows an initial-letter fallback for a user with no avatar", () => {
    render(<Avatar id="avatar-unknown-user" />);
    expect(screen.getByText("მ")).toBeInTheDocument(); // FALLBACK_USER.name = "მომხმარებელი"
  });

  it("renders the profile's avatar image when one is set", () => {
    mergeProfile({ id: "avatar-1", name: "Nini", avatar_url: "https://x/av.jpg" });
    const { container } = render(<Avatar id="avatar-1" />);
    expect(container.querySelector("img")).toHaveAttribute("src", "https://x/av.jpg");
  });

  it("falls back to the initial letter once the image fails to load", () => {
    mergeProfile({ id: "avatar-2", name: "Nini", avatar_url: "https://x/broken.jpg" });
    const { container } = render(<Avatar id="avatar-2" />);
    fireEvent.error(container.querySelector("img"));
    expect(screen.getByText("N")).toBeInTheDocument();
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });
});

describe("FollowBtn", () => {
  it("shows the 'follow' label and calls onToggle when not yet following", () => {
    const onToggle = vi.fn();
    render(<FollowBtn id="u1" isFollowing={() => false} onToggle={onToggle} />);
    expect(screen.getByText(t("follow.follow"))).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledWith("u1");
  });

  it("shows the 'following' label when already following", () => {
    render(<FollowBtn id="u1" isFollowing={() => true} onToggle={() => {}} />);
    expect(screen.getByText(t("follow.following"))).toBeInTheDocument();
  });

  it("stops the click from bubbling to an ancestor handler", () => {
    const parentClick = vi.fn();
    render(<div onClick={parentClick}><FollowBtn id="u1" isFollowing={() => false} onToggle={() => {}} /></div>);
    fireEvent.click(screen.getByRole("button"));
    expect(parentClick).not.toHaveBeenCalled();
  });
});

describe("UploadProgress", () => {
  it("renders nothing when pct is null or undefined", () => {
    const { container } = render(<UploadProgress pct={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("clamps above 100 down to 100%", () => {
    render(<UploadProgress pct={150} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("clamps below 0 up to 0%", () => {
    render(<UploadProgress pct={-20} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("rounds a fractional percentage", () => {
    render(<UploadProgress pct={45.6} />);
    expect(screen.getByText("46%")).toBeInTheDocument();
  });
});

describe("UploadRing", () => {
  it("renders nothing when pct is null or undefined", () => {
    const { container } = render(<UploadRing pct={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders an svg ring for a valid percentage", () => {
    const { container } = render(<UploadRing pct={40} />);
    expect(container.querySelectorAll("circle")).toHaveLength(2);
  });
});

describe("NewThread", () => {
  it("disables submit until the title has non-whitespace content", () => {
    render(<NewThread onClose={() => {}} onCreate={() => {}} />);
    const publish = screen.getByText(t("action.publish"));
    expect(publish).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(t("thread.titlePh")), { target: { value: "   " } });
    expect(publish).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(t("thread.titlePh")), { target: { value: "სათაური" } });
    expect(publish).not.toBeDisabled();
  });

  it("submits trimmed title/body and the selected category", () => {
    const onCreate = vi.fn();
    render(<NewThread onClose={() => {}} onCreate={onCreate} />);
    fireEvent.change(screen.getByPlaceholderText(t("thread.titlePh")), { target: { value: "  სათაური  " } });
    fireEvent.change(screen.getByPlaceholderText(t("thread.bodyPh")), { target: { value: "  ტექსტი  " } });
    fireEvent.click(screen.getByText("დიზაინი"));
    fireEvent.click(screen.getByText(t("action.publish")));
    expect(onCreate).toHaveBeenCalledWith({ title: "სათაური", body: "ტექსტი", cat: "დიზაინი" });
  });

  it("closes on a backdrop click but not on a click inside the panel", () => {
    const onClose = vi.fn();
    const { container } = render(<NewThread onClose={onClose} onCreate={() => {}} />);
    fireEvent.click(screen.getByPlaceholderText(t("thread.titlePh")));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(container.firstChild);
    expect(onClose).toHaveBeenCalled();
  });

  it("pre-fills fields and shows edit labels when editing an existing thread", () => {
    render(<NewThread onClose={() => {}} onCreate={() => {}} initial={{ title: "ძველი სათაური", body: "ძველი ტექსტი", cat: "დიზაინი" }} />);
    expect(screen.getByDisplayValue("ძველი სათაური")).toBeInTheDocument();
    expect(screen.getByText(t("thread.edit"))).toBeInTheDocument();
    expect(screen.getByText(t("action.save"))).toBeInTheDocument();
  });
});

describe("Checkout", () => {
  const item = { price: 100, image: "https://x/a.jpg", title: "მაგიდა", location: "თბილისი" };

  it("defaults to shipping (a 5₾ fee) and totals price+fee", () => {
    render(<Checkout item={item} onClose={() => {}} onDone={() => {}} onPlace={() => {}} />);
    expect(screen.getByText("5₾")).toBeInTheDocument();
    expect(screen.getByText("105₾")).toBeInTheDocument();
  });

  it("switching to pickup drops the fee to 0, hides the address field, and totals just the item price", () => {
    const onPlace = vi.fn();
    render(<Checkout item={item} onClose={() => {}} onDone={() => {}} onPlace={onPlace} />);
    const buttons = screen.getAllByRole("button");
    expect(screen.getByPlaceholderText(t("checkout.addressPh"))).toBeInTheDocument();
    fireEvent.click(buttons[2]); // pickup option
    expect(screen.getByText("0₾")).toBeInTheDocument(); // fee row
    expect(screen.queryByPlaceholderText(t("checkout.addressPh"))).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button")[5]); // confirm
    expect(onPlace).toHaveBeenCalledWith({ delivery: "pickup", payment: "card", address: "", total: 100 });
  });

  it("confirming calls onPlace with the current delivery/payment/total, then shows the success screen", () => {
    const onPlace = vi.fn();
    render(<Checkout item={item} onClose={() => {}} onDone={() => {}} onPlace={onPlace} />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[4]); // cash payment
    fireEvent.click(buttons[5]); // confirm
    expect(onPlace).toHaveBeenCalledWith({ delivery: "ship", payment: "cash", address: "", total: 105 });
    expect(screen.getByText(t("checkout.orderReceived"))).toBeInTheDocument();
  });

  it("the success screen's done button calls onDone", () => {
    const onDone = vi.fn();
    render(<Checkout item={item} onClose={() => {}} onDone={onDone} onPlace={() => {}} />);
    fireEvent.click(screen.getAllByRole("button")[5]); // confirm -> success screen
    fireEvent.click(screen.getByText(t("checkout.done")));
    expect(onDone).toHaveBeenCalled();
  });
});

describe("EmojiPanel", () => {
  it("renders every emoji and calls onPick with the clicked one", () => {
    const onPick = vi.fn();
    render(<EmojiPanel onPick={onPick} />);
    expect(screen.getAllByRole("button")).toHaveLength(EMOJIS.length);
    fireEvent.click(screen.getByText(EMOJIS[3]));
    expect(onPick).toHaveBeenCalledWith(EMOJIS[3]);
  });
});

describe("GroupPost", () => {
  it("toggles a local like and increments the shown count", () => {
    const p = { id: "p1", authorId: "u1", text: "hi", likes: 3, cc: 0, time: "1h" };
    render(<GroupPost p={p} onOpenProfile={() => {}} />);
    fireEvent.click(screen.getByText("3"));
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("shows an edit/delete menu only for the post's own author", () => {
    setME("me-1");
    const theirs = { id: "p2", authorId: "someone-else", text: "hi", likes: 0, cc: 0, time: "1h" };
    render(<GroupPost p={theirs} onOpenProfile={() => {}} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getAllByRole("button")).toHaveLength(2); // avatar + like, no menu
    cleanup();

    const mine = { id: "p3", authorId: "me-1", text: "hi", likes: 0, cc: 0, time: "1h" };
    render(<GroupPost p={mine} onOpenProfile={() => {}} onEdit={() => {}} onDelete={() => {}} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3); // avatar + menu + like
    fireEvent.click(buttons[1]);
    expect(screen.getByText("რედაქტირება")).toBeInTheDocument();
    expect(screen.getByText("წაშლა")).toBeInTheDocument();
  });

  it("edits the post text through the menu, trimming whitespace", () => {
    setME("me-1");
    const onEdit = vi.fn();
    const p = { id: "p4", authorId: "me-1", text: "ძველი", likes: 0, cc: 0, time: "1h" };
    render(<GroupPost p={p} onOpenProfile={() => {}} onEdit={onEdit} onDelete={() => {}} />);
    fireEvent.click(screen.getAllByRole("button")[1]); // menu
    fireEvent.click(screen.getByText("რედაქტირება"));
    fireEvent.change(screen.getByDisplayValue("ძველი"), { target: { value: "  ახალი  " } });
    fireEvent.click(screen.getByText("შენახვა"));
    expect(onEdit).toHaveBeenCalledWith("p4", "ახალი");
  });

  it("deletes the post through the menu", () => {
    setME("me-1");
    const onDelete = vi.fn();
    const p = { id: "p5", authorId: "me-1", text: "x", likes: 0, cc: 0, time: "1h" };
    render(<GroupPost p={p} onOpenProfile={() => {}} onEdit={() => {}} onDelete={onDelete} />);
    fireEvent.click(screen.getAllByRole("button")[1]);
    fireEvent.click(screen.getByText("წაშლა"));
    expect(onDelete).toHaveBeenCalledWith("p5");
  });
});

describe("NewListing", () => {
  it("disables submit until both title and price are present", () => {
    render(<NewListing onClose={() => {}} onCreate={() => {}} onUpload={() => Promise.resolve("")} />);
    const submit = screen.getByText(t("action.publish"));
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(t("listing.whatSelling")), { target: { value: "მაგიდა" } });
    expect(submit).toBeDisabled(); // price still missing
    fireEvent.change(screen.getByPlaceholderText(t("listing.price")), { target: { value: "150" } });
    expect(submit).not.toBeDisabled();
  });

  it("strips non-digit characters from the price field", () => {
    render(<NewListing onClose={() => {}} onCreate={() => {}} onUpload={() => Promise.resolve("")} />);
    const priceInput = screen.getByPlaceholderText(t("listing.price"));
    fireEvent.change(priceInput, { target: { value: "1a5b0" } });
    expect(priceInput.value).toBe("150");
  });

  it("submits a trimmed, numeric payload with the selected category", () => {
    const onCreate = vi.fn();
    render(<NewListing onClose={() => {}} onCreate={onCreate} onUpload={() => Promise.resolve("")} />);
    fireEvent.change(screen.getByPlaceholderText(t("listing.whatSelling")), { target: { value: "  მაგიდა  " } });
    fireEvent.change(screen.getByPlaceholderText(t("listing.price")), { target: { value: "150" } });
    fireEvent.change(screen.getByPlaceholderText(t("listing.descPh")), { target: { value: "  კარგი  " } });
    fireEvent.click(screen.getByText("ავეჯი")); // a MARKET_CATS option
    fireEvent.click(screen.getByText(t("action.publish")));
    expect(onCreate).toHaveBeenCalledWith({ title: "მაგიდა", price: 150, desc: "კარგი", cat: "ავეჯი", image: "", video: null });
  });

  it("uploads a picked image file and includes its resolved URL", async () => {
    const onUpload = vi.fn().mockResolvedValue("https://x/img.jpg");
    const { container } = render(<NewListing onClose={() => {}} onCreate={() => {}} onUpload={onUpload} />);
    const file = new File(["x"], "photo.png", { type: "image/png" });
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(onUpload).toHaveBeenCalledWith(file, expect.any(Function)));
    await waitFor(() => expect(container.querySelector("img")).toHaveAttribute("src", "https://x/img.jpg"));
  });

  it("pre-fills fields and shows edit labels when editing an existing listing", () => {
    render(<NewListing onClose={() => {}} onCreate={() => {}} onUpload={() => Promise.resolve("")} initial={{ title: "ძველი", price: 99, desc: "აღწერა", cat: "ავეჯი", image: "https://x/a.jpg" }} />);
    expect(screen.getByDisplayValue("ძველი")).toBeInTheDocument();
    expect(screen.getByDisplayValue("99")).toBeInTheDocument();
    expect(screen.getByText(t("listing.edit"))).toBeInTheDocument();
    expect(screen.getByText(t("action.save"))).toBeInTheDocument();
  });
});
