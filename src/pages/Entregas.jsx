import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { courseColorClass } from "../lib/courseColors";
import SyncBadge from "../components/SyncBadge";

const WEEK_LABELS = ["D", "L", "M", "M", "J", "V", "S"];
const MONTHS = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

// Al tocar el estado, cicla: sin iniciar -> pendiente -> en proceso -> sin iniciar
const STATUS = {
  sin_iniciar: {
    label: "Sin iniciar",
    cls: "text-slate-400",
    next: "pendiente",
  },
  pendiente: { label: "Pendiente", cls: "text-orange-500", next: "en_proceso" },
  en_proceso: {
    label: "En Proceso",
    cls: "text-blue-500",
    next: "sin_iniciar",
  },
};

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// Semana actual, de domingo a sábado (igual que tu Figma)
function currentWeek() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function Entregas() {
  const [tasks, setTasks] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const week = useMemo(currentWeek, []);
  const todayKey = dayKey(new Date());

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          "id, title, due_at, priority, status, source, course:courses(name, color)",
        )
        .neq("status", "completada")
        .order("due_at", { ascending: true });

      if (error) setError(error.message);
      else setTasks(data);
      setLoading(false);
    }
    load();
  }, []);

  async function cycleStatus(task) {
    const next = STATUS[task.status]?.next;
    if (!next) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)),
    );

    const { error } = await supabase
      .from("tasks")
      .update({ status: next })
      .eq("id", task.id);
    if (error) {
      setError(error.message);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    }
  }

  const keysWithTasks = useMemo(
    () => new Set(tasks.map((t) => dayKey(new Date(t.due_at)))),
    [tasks],
  );

  const visible = selectedKey
    ? tasks.filter((t) => dayKey(new Date(t.due_at)) === selectedKey)
    : tasks;

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Entregas</h1>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-7">
          {week.map((d, i) => {
            const key = dayKey(d);
            const isToday = key === todayKey;
            const isSelected = key === selectedKey;

            return (
              <button
                key={key}
                onClick={() => setSelectedKey(isSelected ? null : key)}
                className="flex flex-col items-center gap-1 py-1"
              >
                <span className="text-xs text-slate-400">{WEEK_LABELS[i]}</span>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium ${
                    isToday ? "bg-indigo-600 text-white" : "text-slate-700"
                  } ${isSelected ? "ring-2 ring-indigo-300" : ""}`}
                >
                  {d.getDate()}
                </span>
                <span
                  className={`h-1 w-1 rounded-full ${
                    keysWithTasks.has(key) ? "bg-indigo-400" : "bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <h2 className="mt-6 text-lg font-bold text-slate-900">
        Entregas Críticas
      </h2>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-3 space-y-3">
        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : visible.length === 0 ? (
          <p className="py-10 text-center text-slate-400">
            No hay entregas pendientes.
          </p>
        ) : (
          visible.map((task) => {
            const due = new Date(task.due_at);
            const overdue = due < new Date();
            const status = STATUS[task.status];

            return (
              <div
                key={task.id}
                className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div
                  className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl ${
                    overdue
                      ? "bg-red-50 text-red-600"
                      : "bg-slate-100 text-indigo-600"
                  }`}
                >
                  <span className="text-lg font-bold leading-none">
                    {due.getDate()}
                  </span>
                  <span className="mt-1 text-[10px] font-semibold">
                    {MONTHS[due.getMonth()]}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    {task.course ? (
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${courseColorClass(task.course.color)}`}
                      >
                        {task.course.name}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="flex items-center gap-2">
                      <SyncBadge source={task.source} />
                      <button
                        onClick={() => cycleStatus(task)}
                        className={`text-xs font-medium ${status?.cls ?? "text-slate-400"}`}
                      >
                        {status?.label}
                      </button>
                    </span>
                  </div>

                  <h3 className="mt-2 font-semibold text-slate-900">
                    {task.title}
                  </h3>
                  {overdue && (
                    <p className="mt-1 text-xs font-medium text-red-500">
                      Vencida
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
