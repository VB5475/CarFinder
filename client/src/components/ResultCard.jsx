import { useState } from "react";

function StarRating({ rating }) {
  const stars = 5;
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: stars }, (_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < rating ? "text-amber-400" : "text-slate-200"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function SpecChip({ label }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
      {label}
    </span>
  );
}

export default function ResultCard({ car }) {
  const [imgError, setImgError] = useState(false);

  const mileageOrRange =
    car.fuel_type === "electric" && car.range_km != null
      ? `${car.range_km} km range`
      : car.mileage_kmpl != null
        ? `${car.mileage_kmpl} kmpl`
        : null;

  const specs = [
    car.fuel_type,
    car.transmission,
    mileageOrRange,
    car.seats ? `${car.seats} seats` : null,
  ].filter(Boolean);

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-100">
      <div className="aspect-[16/10] w-full bg-slate-100">
        {!imgError && car.image_url ? (
          <img
            src={car.image_url}
            alt={`${car.make} ${car.model}`}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full min-h-[160px] items-center justify-center bg-slate-200 text-sm text-slate-500">
            No image available
          </div>
        )}
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            {car.make} {car.model}
          </h3>
          <p className="text-sm text-slate-500">{car.variant}</p>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-lg font-semibold text-blue-600">
            ₹{car.price_lakh} Lakh
          </p>
          {car.monthly_emi_approx && (
            <p className="text-sm text-slate-500">
              EMI ~₹{car.monthly_emi_approx.toLocaleString("en-IN")}/mo
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {specs.map((s) => (
            <SpecChip key={s} label={s} />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Safety</span>
          <StarRating rating={car.safety_rating || 0} />
        </div>

        {car.pros?.length > 0 && (
          <ul className="space-y-1.5">
            {car.pros.map((pro) => (
              <li key={pro} className="flex gap-2 text-sm text-slate-700">
                <span className="mt-0.5 shrink-0 text-green-600" aria-hidden>
                  ✓
                </span>
                {pro}
              </li>
            ))}
          </ul>
        )}

        {car.cons?.length > 0 && (
          <ul className="space-y-1.5">
            {car.cons.map((con) => (
              <li key={con} className="flex gap-2 text-sm text-slate-500">
                <span className="mt-0.5 shrink-0 text-slate-400" aria-hidden>
                  ✕
                </span>
                {con}
              </li>
            ))}
          </ul>
        )}

        {car.why_recommended && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-blue-900">
            {car.why_recommended}
          </div>
        )}

        {car.relaxed && (
          <p className="text-xs text-amber-700">
            Shown with relaxed fuel/body filters to widen matches.
          </p>
        )}
      </div>
    </article>
  );
}
