import { Medal } from "lucide-react";
export function Podium({ rows }: { rows: { name: string; xp: number }[] }) {
  return (
    <div className="ref-rankings">
      {rows.length > 0 && (
        <div className="ref-podium" aria-label="Top ranked participants">
          {[1, 0, 2]
            .filter((i) => rows[i])
            .map((i) => (
              <div key={i} className={`ref-podium-place place-${i + 1}`}>
                <Medal size={30} />
                <strong>{rows[i].name}</strong>
                <span>{rows[i].xp} XP</span>
                <div>
                  <b>{i + 1}</b>
                </div>
              </div>
            ))}
        </div>
      )}
      {rows.slice(3).map((r, i) => (
        <div className="ref-ranking-row" key={`${r.name}-${i}`}>
          <b>{i + 4}</b>
          <strong>{r.name}</strong>
          <span>{r.xp} XP</span>
        </div>
      ))}
    </div>
  );
}
