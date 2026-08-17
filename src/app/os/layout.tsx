import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";
import OsShell from "@/components/os/OsShell";

export const metadata: Metadata = {
  title: "Alpheris OS",
  description: "The personal operating system for running Alpheris.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Alpheris OS",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0c10",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function OsLayout({ children }: { children: ReactNode }) {
  return <OsShell>{children}</OsShell>;
}
