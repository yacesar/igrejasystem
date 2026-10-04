import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MCA Igrejas",
    short_name: "MCA",
    description: "Sistema de gestão para igrejas.",
    start_url: "/app",
    display: "standalone",
    background_color: "#f9f8f6",
    theme_color: "#4a4bd1",
    lang: "pt-BR",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
