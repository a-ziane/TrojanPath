const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Explicit controls also work in browsers without a native month input. */
export function GraduationField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [year = "", month = ""] = value.split("-");
  return (
    <div className="graduation-fields">
      <select
        aria-label="Graduation month"
        required
        value={month}
        onChange={(e) => onChange(`${year}-${e.target.value}`)}
      >
        <option value="">Month</option>
        {months.map((label, index) => (
          <option key={label} value={String(index + 1).padStart(2, "0")}>
            {label}
          </option>
        ))}
      </select>
      <input
        aria-label="Graduation year"
        required
        type="text"
        inputMode="numeric"
        pattern="[0-9]{4}"
        maxLength={4}
        placeholder="Year (e.g. 2028)"
        value={year}
        onChange={(e) =>
          onChange(`${e.target.value.replace(/\D/g, "").slice(0, 4)}-${month}`)
        }
      />
    </div>
  );
}
