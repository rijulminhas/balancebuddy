import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BalanceBuddy — Expense OS",
    short_name: "BalanceBuddy",
    description:
      "Manage expenses, chores, inventory, and settlements for your shared home.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#000000",
    categories: ["productivity", "finance", "lifestyle"],
    icons: [],
    screenshots: [],
  };
}
