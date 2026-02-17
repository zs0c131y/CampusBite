import { Link } from 'react-router-dom'
import {
  UtensilsCrossed,
  Smartphone,
  Clock,
  Search,
  CreditCard,
  Bell,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const FEATURES = [
  {
    icon: Search,
    title: 'Browse Menus',
    description: 'View menus from all campus food outlets in one place. Find your favourite meals instantly.',
  },
  {
    icon: CreditCard,
    title: 'Pay with UPI',
    description: 'Quick and secure UPI payments. No cash, no hassle -- just scan and pay.',
  },
  {
    icon: Bell,
    title: 'Skip the Queue',
    description: 'Get notified when your order is ready. Walk in, pick up, and enjoy.',
  },
]

const STEPS = [
  {
    number: '1',
    title: 'Choose your food',
    description: 'Browse menus from any campus outlet and add items to your cart.',
  },
  {
    number: '2',
    title: 'Pay securely via UPI',
    description: 'Complete your order with a quick and secure UPI payment.',
  },
  {
    number: '3',
    title: 'Show OTP & collect',
    description: 'Show your OTP at the counter to collect your freshly prepared order.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <nav className="w-full border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-orange-600" />
            <span className="text-xl font-bold text-orange-600 tracking-tight">CampusBite</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">
                <span className="flex items-center gap-1">
                  Get Started
                  <ChevronRight className="h-4 w-4" />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-32 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Order Food from Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                Campus Canteen
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto md:mx-0">
              Skip the queue. Order ahead. Pick up when ready. The easiest way to get food on
              campus.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start">
              <Link to="/register">
                <Button size="lg" className="text-base px-8">
                  <span className="flex items-center gap-2">
                    Get Started
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="text-base px-8">
                  Browse Menu
                </Button>
              </Link>
            </div>
          </div>

          {/* Decorative illustration placeholder */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96">
              {/* Gradient circles */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-200 via-amber-100 to-orange-50 opacity-60" />
              <div className="absolute top-8 left-8 right-8 bottom-8 rounded-full bg-gradient-to-tr from-orange-300 via-amber-200 to-yellow-100 opacity-40" />
              <div className="absolute top-16 left-16 right-16 bottom-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 opacity-30" />
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <UtensilsCrossed className="h-20 w-20 text-orange-500 opacity-80" />
              </div>
            </div>
          </div>
        </div>

        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-gradient-to-l from-orange-50 to-transparent" />
        <div className="absolute bottom-0 left-0 -z-10 w-1/3 h-1/2 bg-gradient-to-t from-amber-50 to-transparent" />
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Everything you need
            </h2>
            <p className="text-muted-foreground mt-3 text-lg max-w-2xl mx-auto">
              CampusBite makes ordering food on campus simple, fast, and convenient.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <Card
                  key={feature.title}
                  className="border-0 shadow-md hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-orange-100">
                      <Icon className="h-7 w-7 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How it works</h2>
            <p className="text-muted-foreground mt-3 text-lg max-w-2xl mx-auto">
              Three simple steps to get your food without the wait.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, index) => (
              <div key={step.number} className="relative text-center space-y-4">
                {/* Connector line (desktop only) */}
                {index < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-orange-300 to-orange-100" />
                )}

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white text-xl font-bold shadow-lg relative z-10">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/register">
              <Button size="lg" className="text-base px-10">
                <span className="flex items-center gap-2">
                  Start Ordering
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-orange-600" />
              <span className="font-bold text-orange-600">CampusBite</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} CampusBite. Built for campus communities.
            </p>
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-orange-600 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm text-muted-foreground hover:text-orange-600 transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
