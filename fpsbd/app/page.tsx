import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#1a1a1a] text-white">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex items-center justify-center gap-3">
          <i className="fas fa-book text-4xl text-[#ff6b35]"></i>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#ff6b35] to-white bg-clip-text text-transparent">
            LMS7
          </h1>
        </div>
        <p className="text-lg text-gray-300">Library Management System Backend is running successfully.</p>
        <div className="pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-[#ff6b35] to-[#f7931e] text-white font-semibold transition-transform hover:scale-105"
          >
            <i className="fas fa-tachometer-alt"></i> Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
