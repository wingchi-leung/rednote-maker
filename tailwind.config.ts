import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          gray6: "#F5F5F7",
          blue: "#0071E3",
          border: "#D2D2D7",
        },
      },
      fontFamily: {
        sans: ["SF Pro", "Inter", "PingFang SC", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
