import { Literature } from "@handlemotion/literature/devtools";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Literature />
      </body>
    </html>
  );
}
