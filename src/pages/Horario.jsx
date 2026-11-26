import { useEffect, useMemo, useState } from "react";
import { User } from "lucide-react";
import ClassPlace from "../components/ClassPlace";
import SyncBadge from "../components/SyncBadge";
import { supabase } from "../lib/supabase";
import { courseColorClass } from "../lib/courseColors";

const DAYS = [
  { id: 1, label: "Lun" },
  { id: 2, label: "Mar" },
  { id: 3, label: "Mié" },
  { id: 4, label: "Jue" },
  { id: 5, label: "Vie" },
];

// getDay(): 0 = domingo ... 6 = sábado. Lo convertimos a 1 = lunes ... 7 = domingo
function todayId() {
  const d = new Date().getDay();
  return d === 0 ? 7 : d;
}

const hhmm = (time) => time.slice(0, 5);

export default function Horario() {
  const today = todayId();
  const [selected, setSelected] = useState(today <= 5 ? today : 1);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("class_sessions")
        .select(
          "id, day_of_week, start_time, end_time, location, meeting_url, source, course:courses(name, color, professor)",
        )
        .order("start_time", { ascending: true });

      if (error) setError(error.message);
      else setSessions(data);
      setLoading(false);
    }
    load();
  }, []);

  const daySessions = useMemo(
    () => sessions.filter((s) => s.day_of_week === selected),
    [sessions, selected],
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Horario Semanal</h1>

      <div className="mt-5 grid grid-cols-5 gap-2">
        {DAYS.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelected(d.id)}
            className={`relative rounded-full py-2.5 text-sm font-medium transition ${
              selected === d.id
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {d.label}
            {d.id === today && (
              <span
                className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                  selected === d.id ? "bg-white" : "bg-indigo-600"
                }`}
              />
            )}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : daySessions.length === 0 ? (
          <p className="py-10 text-center text-slate-400">
            No tienes clases este día.
          </p>
        ) : (
          daySessions.map((s) => (
            <div key={s.id} className="flex gap-3">
              <div className="w-12 shrink-0 pt-4 text-xs font-semibold text-indigo-600">
                {hhmm(s.start_time)}
              </div>

              <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${courseColorClass(s.course?.color)}`}
                  >
                    {s.course?.name}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-slate-400">
                    <SyncBadge source={s.source} />
                    {hhmm(s.start_time)} - {hhmm(s.end_time)}
                  </span>
                </div>

                <h3 className="mt-3 font-semibold text-slate-900">
                  {s.course?.name}
                </h3>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <ClassPlace session={s} />
                  {s.course?.professor && (
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      {s.course.professor}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
