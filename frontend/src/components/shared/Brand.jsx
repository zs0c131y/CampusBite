import { Link } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";

export function Brand({ to = "/" }) {
  return (
    <Link to={to} className="brand" aria-label="CampusBite home">
      <span className="brand-mark">
        <UtensilsCrossed size={19} />
      </span>
      <span className="whitespace-nowrap">
        campusbite<span className="text-primary">.</span>
      </span>
    </Link>
  );
}
