import type { Metadata } from "next";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { StaffHeader } from "@/components/layout/staff-header";

export const metadata: Metadata = {
  title: "Staff Order - Felix Snack POS",
};

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col pb-14">
      <StaffHeader />
      <main className="flex-1">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
