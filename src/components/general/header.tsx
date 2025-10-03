// components/Header.jsx
import Link from 'next/link'
import ThemeSwitcher from '../ui/ThemeSwitcher'

export default function Header() {
  return (
    <header className="bg-gray-800 dark:bg-gray-900 text-white dark:text-gray-100 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="text-xl font-semibold">Logo</div>
        <nav className="flex items-center space-x-8">
          <Link href="/" className="hover:text-gray-300 dark:hover:text-gray-400 transition-colors">
            Hjem
          </Link>
          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  )
}
