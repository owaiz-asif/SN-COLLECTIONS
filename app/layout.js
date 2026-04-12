import './globals.css'

export const metadata = {
  title: "SN Collections",
  description: "Trendy jewelry and accessories",
  verification: {
    google: "google4df4248576b30e43"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}