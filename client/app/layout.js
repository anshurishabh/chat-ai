import './globals.css'

export const metadata = {
  title: 'NexChat — AI Powered Messenger',
  description: 'Next generation AI chat application',
  icons: {
    icon: '/logo.png', // Yahan tumhara logo load hoga
    apple: '/logo.png',
    title: 'NexChat',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased" data-theme="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#7c3aed" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="h-full w-full bg-[#0a0a14] text-[#ffffff] overflow-hidden" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}