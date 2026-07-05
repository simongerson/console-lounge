import { Geist } from 'next/font/google'
import './globals.css'
import NavWrapper from '@/components/NavWrapper'

const geist = Geist({ subsets: ['latin'] })

export const metadata = {
  title: 'Console Lounge Manager',
  description: 'Gaming lounge session and shift management',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='light')document.documentElement.classList.add('dark');}catch(e){}})();`
        }} />
      </head>
      <body className={geist.className}>
        <NavWrapper>{children}</NavWrapper>
        <script dangerouslySetInnerHTML={{
          __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}`
        }} />
      </body>
    </html>
  )
}