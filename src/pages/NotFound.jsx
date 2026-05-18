import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-gradient-to-br from-slate-50 to-slate-100">
      <h1 className="text-7xl md:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
        404
      </h1>
      <h2 className="mt-4 text-2xl md:text-3xl font-semibold text-slate-800">
        Page Not Found
      </h2>
      <p className="mt-2 text-slate-600 max-w-md">
        Page you looking for moved or never existed.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          to="/"
          className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
        >
          Back to Home
        </Link>
        <Link
          to="/contact"
          className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-white transition"
        >
          Contact Us
        </Link>
      </div>
    </div>
  )
}
