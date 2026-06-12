import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Display - Felix Snack POS",
};

export default function CustomerDisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-screen w-screen overflow-hidden">{children}</div>;
}
