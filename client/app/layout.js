import './globals.css'

export const metadata = {
  title: 'NexChat — AI Powered Messenger',
  description: 'Next generation AI chat application portfolio execution architecture layer matrix',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="h-full w-full bg-[#0a0a14] text-[#ffffff] overflow-hidden" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}