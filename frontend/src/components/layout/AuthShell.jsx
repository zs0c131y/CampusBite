import { Link } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { Brand } from "@/components/shared/Brand";
export function AuthShell({ children }) {
  return (
    <div className="auth-shell">
      <aside className="auth-story">
        <Brand />
        <div>
          <p className="eyebrow mb-5 text-accent">Campus food ordering</p>
          <h2>
            ORDER AHEAD.
            <br />
            <span className="text-accent">COLLECT FRESH.</span>
          </h2>
          <p className="mt-6 max-w-xs text-sm text-background/65">
            Browse campus outlets, place your order, and receive updates when
            your food is ready for pickup.
          </p>
          <div className="auth-ticket receipt mt-10 max-w-xs -rotate-3">
            <p className="eyebrow">Order in three steps</p>
            <div className="receipt-rule" />
            {[
              "Find your favourite outlet",
              "Order and pay with UPI",
              "Collect when it’s ready",
            ].map((text) => (
              <p
                key={text}
                className="my-3 flex items-center justify-between text-sm"
              >
                {text}
                <Check size={16} />
              </p>
            ))}
            <div className="receipt-rule" />
            <div className="barcode" aria-hidden="true" />
          </div>
        </div>
        <p className="story-bottom eyebrow text-background/45">
          Convenient ordering. Reliable pickup.
        </p>
      </aside>
      <section className="auth-form">
        <Link
          to="/"
          className="mb-8 inline-flex w-fit items-center gap-2 text-xs text-muted-foreground"
        >
          <ArrowLeft size={14} /> Back to home
        </Link>
        {children}
      </section>
    </div>
  );
}
