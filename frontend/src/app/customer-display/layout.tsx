import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Display - Felix Snack POS",
  // Prevent search indexing for customer display pages
  robots: "noindex, nofollow",
};

export default function CustomerDisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full w-full">
      <body className="h-full w-full overflow-hidden bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
