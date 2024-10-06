// pages/index.js
import Head from 'next/head';
import Header from './components/Header';
import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Dekos</title>
        <meta name="description" content="DekosHosting" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Include the Header */}
      <Header />

      <main className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <h1 className="text-4xl font-bold text-gray-800">
          Welcome to <span className="text-blue-600">DekosHost</span>
        </h1>
        <p className="mt-4 text-lg text-gray-500">
          Free & Affordable VPS Hosting.
        </p>
        <button className="mt-8 px-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700">
        <Link href="/login" passHref>
            Get Started
        </Link>
      </button>
      </main>

      <footer className="w-full py-6 text-center text-gray-600">
        Powered by Dekos.
      </footer>
    </div>
  );
}
