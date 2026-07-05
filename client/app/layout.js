import './globals.css'

export const metadata = {
  title: 'NexChat — AI Powered Messenger',
  description: 'Next generation AI chat application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a14" />
      </head>
      <body suppressHydrationWarning>
        <ThemeWrapper>
          {children}
        </ThemeWrapper>
      </body>
    </html>
  )
}

function ThemeWrapper({ children }) {
  return (
    <div id="app-root">
      {children}
    </div>
  )
}