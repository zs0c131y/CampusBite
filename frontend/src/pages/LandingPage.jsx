import { Link } from "react-router-dom";
import {
  ArrowRight,
  BellRing,
  ChevronRight,
  Clock3,
  CreditCard,
  Search,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Search,
    title: "Find Food Fast",
    description:
      "Browse every campus outlet in one place, with clear categories and quick search.",
  },
  {
    icon: CreditCard,
    title: "Pay in Seconds",
    description:
      "Complete checkout quickly with UPI and track payment status without refreshing.",
  },
  {
    icon: BellRing,
    title: "Pickup on Time",
    description:
      "Get real-time order updates and collect food when it is ready, not while waiting in line.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Choose a store",
    description: "Browse menus, compare items, and add what you want.",
  },
  {
    number: "02",
    title: "Place order",
    description: "Confirm your order and complete payment in one flow.",
  },
  {
    number: "03",
    title: "Collect with OTP",
    description: "Show pickup OTP at the counter and grab your meal fast.",
  },
];

const STATS = [
  { value: "3 Steps", label: "To place any order" },
  { value: "Live", label: "Order status tracking" },
  { value: "UPI", label: "Campus-friendly payments" },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 right-[-8rem] h-[22rem] w-[22rem] rounded-full bg-amber-300/20 blur-3xl" />
        <div className="absolute bottom-[-9rem] left-[-6rem] h-[18rem] w-[18rem] rounded-full bg-orange-300/20 blur-3xl" />
      </div>

      <section className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 p-2 text-white shadow-md">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold tracking-tight">CampusBite</p>
              <p className="text-xs text-muted-foreground">
                Campus food ordering
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register" className="flex items-center gap-1.5">
                Join
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        <div className="mt-10 grid items-center gap-10 lg:mt-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              Built for campus ordering workflows
            </p>

            <h1 className="max-w-xl text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Skip the queue.
              <span className="block text-orange-700">
                Pick up food when it is ready.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              CampusBite helps students, faculty, and store teams manage food
              orders faster with clean menus, instant checkout, and real-time
              status updates.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="justify-center" asChild>
                <Link to="/register">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="justify-center"
                asChild
              >
                <Link to="/login">Browse Stores</Link>
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border/80 bg-white/80 px-4 py-3 shadow-sm"
                >
                  <p className="text-lg font-semibold leading-none">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Card className="border-amber-200/80 bg-white/90 shadow-xl">
            <CardContent className="space-y-5 p-5 sm:p-6">
              <p className="text-sm font-semibold text-foreground">
                How CampusBite helps daily
              </p>
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{feature.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border/80 bg-white/85 p-5 shadow-lg sm:p-8">
          <div className="mb-6 flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-orange-700" />
            <p className="text-sm font-medium text-muted-foreground">
              Order flow
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border border-border/70 bg-background/70 p-4"
              >
                <p className="text-xs font-semibold tracking-[0.15em] text-orange-700">
                  {step.number}
                </p>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/80 bg-white/70">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-6 text-sm sm:px-6 lg:px-8">
          <p className="text-muted-foreground">
            &copy; {new Date().getFullYear()} CampusBite
          </p>
        </div>
      </footer>
    </div>
  );
}
