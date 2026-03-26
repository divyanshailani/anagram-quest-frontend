import "./globals.css";

export const metadata = {
  title: "Anagram Quest — Watch AI Play",
  description: "Watch a GRPO-trained Qwen3 AI solve anagrams in real-time with MDP-based banking strategy",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
