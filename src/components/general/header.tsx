// components/Header.jsx
import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-gray-800 text-white px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="text-xl font-semibold">Logo</div>
        <nav className="flex items-center space-x-8">
          <Link href="/" className="hover:text-gray-300 transition-colors">
            Hjem
          </Link>
      
        </nav>
      </div>
    </header>
  )
}
