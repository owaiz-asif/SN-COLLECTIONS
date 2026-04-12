import './globals.css'

export const metadata = {
  title: "SN Collections",
  description: "Trendy jewelry and accessories",
  verification: {
    google: "RmagooHyEv7H6JRmLIUPTsHQ_eJcxBdplPWYN75u7HU"
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