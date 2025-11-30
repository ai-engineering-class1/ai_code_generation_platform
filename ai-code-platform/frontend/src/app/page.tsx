import Link from 'next/link'
import { ArrowRight, Code2, GitBranch, Zap, Activity } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code2 className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">AI Code Platform</span>
          </div>
          <div className="space-x-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link 
              href="/register" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Automate Your Software Development with AI
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Transform Jira requirements into production-ready code automatically. 
            From specs to deployment, all in one platform.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/register" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link 
              href="/demo" 
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition"
            >
              Watch Demo
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <FeatureCard
            icon={<GitBranch className="h-8 w-8 text-blue-600" />}
            title="Jira Integration"
            description="Automatically sync requirements from Jira and track progress in real-time."
          />
          <FeatureCard
            icon={<Code2 className="h-8 w-8 text-blue-600" />}
            title="AI Code Generation"
            description="Generate production-ready code using Claude AI based on specifications."
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8 text-blue-600" />}
            title="Automated CI/CD"
            description="Automated testing, code review, and deployment through GitHub Actions."
          />
          <FeatureCard
            icon={<Activity className="h-8 w-8 text-blue-600" />}
            title="Progress Tracking"
            description="Monitor every step from requirement to deployment in one dashboard."
          />
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto">
          <StatCard number="60%" label="Faster Development" />
          <StatCard number="85%" label="Success Rate" />
          <StatCard number="2hrs" label="Avg. Time to Deploy" />
        </div>
      </main>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { 
  icon: React.ReactNode
  title: string
  description: string 
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-blue-600 mb-2">{number}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  )
}

