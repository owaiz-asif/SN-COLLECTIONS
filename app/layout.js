import './globals.css'

export const metadata = {
  title: "SN Collections",  
  description: "Trendy jewelry and accessories",
  
  applicationName: "SN Collections",

  openGraph: {
    title: "SN Collections",
    siteName: "SN Collections",
  },

  verification: {
    google: "RmagooHyEv7H6JRmLIUPTsHQ_eJcxBdplPWYN75u7HU"
  },
  icons: {
    icon: "/logo.png",
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