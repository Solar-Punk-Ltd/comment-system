import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    build: {
      lib: {
        entry: resolve(__dirname, "src/index.ts"),
        name: "swarm-comment-system",
        formats: ["es", "cjs", "umd"],
        fileName: format => `index.${format}.js`,
      },
      sourcemap: isProd,
      rollupOptions: {
        external: ["@ethersphere/bee-js"],
        output: {
          globals: {
            "@ethersphere/bee-js": "BeeJS",
          },
        },
      },
    },
    plugins: [
      dts({
        exclude: "**/test/**",
        outDir: "dist/types",
        // entryRoot: "src",
      }),
    ],
    extensions: [".ts", ".js"],
  };
});
