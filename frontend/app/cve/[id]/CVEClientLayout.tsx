"use client";
import React from "react";
import { useParams } from "next/navigation";

export default function CVEClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  // You can use params or any client-side logic here
  return <>{children}</>;
}
