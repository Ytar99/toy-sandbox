import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Get the repository name from the environment (GitHub Actions sets GITHUB_REPOSITORY)
const getBase = () => {
  if (process.env.GITHUB_ACTIONS) {
    const repo = process.env.GITHUB_REPOSITORY;
    if (repo) {
      // GITHUB_REPOSITORY is "owner/repo-name"
      const [, repoName] = repo.split("/");
      return `/${repoName}/`;
    }
  }
  return "/"; // default for custom domains or root
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: getBase(),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
