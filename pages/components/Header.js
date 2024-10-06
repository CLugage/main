// components/Header.js
import Link from 'next/link';

export default function Header() {
  return (
    <header className="w-full bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="text-2xl font-bold text-blue-600">
          <Link href="/">DekosHosting</Link> {/* No <a> needed */}
        </div>

        {/* Navigation Links */}
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link href="/" className="text-gray-700 hover:text-blue-600">Home</Link>
            </li>
            <li>
              <Link href="/about" className="text-gray-700 hover:text-blue-600">About</Link>
            </li>
            <li>
              <Link href="/services" className="text-gray-700 hover:text-blue-600">Services</Link>
            </li>
            <li>
              <Link href="/contact" className="text-gray-700 hover:text-blue-600">Contact</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
