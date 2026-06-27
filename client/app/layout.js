import './globals.css'

export const metadata = {
  title: 'NexChat - AI Powered Messenger',
  description: 'Chat app with AI features',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white min-h-screen">
        {children}
      </body>
    </html>
  )
}