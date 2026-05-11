import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="暂无数据" />);
    expect(screen.getByText("暂无数据")).toBeDefined();
  });

  it("renders description when provided", () => {
    render(<EmptyState title="暂无" description="请先添加" />);
    expect(screen.getByText("请先添加")).toBeDefined();
  });

  it("renders icon when provided", () => {
    render(<EmptyState icon={<BookOpen data-testid="icon" />} title="暂无" />);
    expect(screen.getByTestId("icon")).toBeDefined();
  });
});

describe("ErrorMessage", () => {
  it("renders message", () => {
    render(<ErrorMessage message="出错了" />);
    expect(screen.getByText("出错了")).toBeDefined();
  });

  it("renders nothing when message is empty", () => {
    const { container } = render(<ErrorMessage message="" />);
    expect(container.firstChild).toBeNull();
  });
});

describe("Skeleton", () => {
  it("renders correct count of card skeletons", () => {
    const { container } = render(<Skeleton type="card" count={2} />);
    const cards = container.querySelectorAll(".animate-pulse");
    expect(cards.length).toBe(2);
  });

  it("renders table-row skeleton", () => {
    const { container } = render(<Skeleton type="table-row" count={1} />);
    expect(container.querySelector(".animate-pulse")).toBeDefined();
  });
});
