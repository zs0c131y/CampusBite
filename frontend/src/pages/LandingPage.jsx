import { createElement } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  UtensilsCrossed,
  Check,
  Clock,
  Smartphone,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
const steps = [
  {
    number: "01",
    icon: UtensilsCrossed,
    title: "Choose an outlet",
    description: "Browse campus outlets and select items from their menus.",
  },
  {
    number: "02",
    icon: Smartphone,
    title: "Place your order",
    description:
      "Review your items, add any instructions, and complete payment with UPI.",
  },
  {
    number: "03",
    icon: Ticket,
    title: "Collect your food",
    description:
      "Track your order and present your pickup code when your food is ready.",
  },
];
export default function LandingPage() {
  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <section className="landing-hero">
          <div>
            <p className="eyebrow mb-6 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" /> Campus food
              ordering
            </p>
            <h1 className="hero-title">
              ORDER AHEAD.
              <br />
              <span className="text-primary">COLLECT FRESH.</span>
            </h1>
            <p className="mt-7 max-w-md text-base text-muted-foreground sm:text-lg">
              Browse campus outlets, order your meal, and track its progress.
              Collect your food when it is ready.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="lg" asChild>
                <Link to="/register">
                  Create an account <ArrowRight size={18} />
                </Link>
              </Button>
              <Link
                to="/login"
                className="border-b border-foreground/40 pb-1 text-sm font-semibold"
              >
                Sign in to order
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              {["Pay with UPI", "Live order updates", "Easy pickup"].map(
                (text) => (
                  <span key={text} className="flex items-center gap-1.5">
                    <Check size={14} className="text-success" />
                    {text}
                  </span>
                ),
              )}
            </div>
          </div>
          <div className="hero-art">
            <p className="eyebrow mb-4 flex items-center justify-between">
              Prepared for pickup <UtensilsCrossed size={16} />
            </p>
            <img
              className="hero-photo"
              src="/images/lunch-bowl.jpg"
              alt="A colourful bowl of fresh vegetables, grains and avocado"
              fetchPriority="high"
            />
            <div className="hero-stamp" aria-hidden="true">
              ORDER.
              <br />
              COLLECT.
            </div>
            <div className="hero-ticket receipt">
              <div className="flex justify-between">
                <span className="eyebrow">CampusBite</span>
                <Ticket size={17} />
              </div>
              <p className="mt-3 font-display text-3xl font-bold">
                ORDER & PICKUP.
              </p>
              <div className="receipt-rule" />
              <div className="space-y-2 text-xs">
                {[
                  "Order ahead",
                  "Track your order",
                  "Collect with a pickup code",
                ].map((text) => (
                  <p key={text} className="flex justify-between">
                    <span>{text}</span>
                    <Check size={14} />
                  </p>
                ))}
              </div>
              <div className="receipt-rule" />
              <div className="barcode" aria-hidden="true" />
              <p className="mt-2 text-center text-[9px] tracking-[.2em]">
                CAMPUS FOOD, MADE CONVENIENT
              </p>
            </div>
          </div>
        </section>
      </div>
      <section
        id="how-it-works"
        className="scroll-mt-24 bg-foreground text-background"
      >
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-3 text-accent">How it works</p>
              <h2 className="text-4xl sm:text-5xl">ORDER IN THREE STEPS.</h2>
            </div>
            <Clock size={28} className="text-accent" />
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map(({ number, icon, title, description }) => (
              <div key={number} className="border-t border-background/25 pt-6">
                <div className="mb-6 flex items-center justify-between">
                  <span className="font-display text-4xl text-accent">
                    {number}
                  </span>
                  {createElement(icon, {
                    size: 23,
                    className: "text-background/70",
                  })}
                </div>
                <h3 className="text-xl">{title}</h3>
                <p className="mt-3 max-w-xs text-sm text-background/65">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section
        id="for-stores"
        className="scroll-mt-24 mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 md:grid-cols-[1fr_auto] md:items-center lg:px-12"
      >
        <div>
          <p className="eyebrow mb-3 text-primary">For campus outlets</p>
          <h2 className="text-4xl">MANAGE ORDERS IN ONE PLACE.</h2>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">
            Receive orders, update your menu, confirm payments, and verify
            pickups from your store dashboard.
          </p>
        </div>
        <Button variant="outline" size="lg" asChild>
          <Link to="/register">
            Register your outlet <ArrowRight size={17} />
          </Link>
        </Button>
      </section>
    </div>
  );
}
