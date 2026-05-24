import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-base">T</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Trelis
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-gray-600 font-medium hover:text-indigo-600 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-md"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          <span className="w-2 h-2 bg-indigo-500 rounded-full" />
          Global Student Network
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
          Connect with{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
            Global Mentors
          </span>
          <br />& Peers
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Find guidance from students and professionals worldwide. Trelis is the global student
          networking platform for extracurricular opportunities, research collaborations, and
          mentorship.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition-all shadow-lg"
          >
            Get Started — It&apos;s Free
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto bg-white text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
          >
            Login
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: '🌍',
              title: 'Global Network',
              desc: 'Connect with students and professionals from universities worldwide across every field and discipline.',
            },
            {
              icon: '🎓',
              title: 'Find Mentors',
              desc: 'Get guidance from experienced students who have navigated paths similar to yours.',
            },
            {
              icon: '🔬',
              title: 'Research & Opportunities',
              desc: 'Discover research collaborations, internships, and extracurricular activities that match your interests.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-indigo-600 to-blue-600 mx-4 sm:mx-8 lg:mx-auto max-w-5xl rounded-3xl p-12 text-center mb-20 shadow-xl">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to find your community?
        </h2>
        <p className="text-indigo-100 text-lg mb-8 max-w-xl mx-auto">
          Join thousands of students already connecting, learning, and growing together on Trelis.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-bold hover:bg-indigo-50 transition-colors shadow-lg"
        >
          Create Your Profile
        </Link>
      </section>
    </main>
  )
}
