import { Calendar, Check } from "lucide-react";
import { courseColorClass } from "../lib/courseColors";
import { formatDue } from "../lib/dates";
import SyncBadge from "./SyncBadge";

const priorityStyles = {
  alta: "text-red-500",
  media: "text-amber-500",
  baja: "text-emerald-500",
};

export default function TaskCard({ task, onToggle }) {
  const done = task.status === "completada";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
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
          <span
            className={`text-xs font-bold uppercase ${priorityStyles[task.priority]}`}
          >
            {task.priority}
          </span>
        </span>
      </div>

      <h3
        className={`mt-3 font-semibold ${
          done ? "text-slate-400 line-through" : "text-slate-900"
        }`}
      >
        {task.title}
      </h3>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar size={16} />
          {formatDue(task.due_at)}
        </span>
        <button
          onClick={() => onToggle(task)}
          aria-label={done ? "Marcar como pendiente" : "Marcar como completada"}
          className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition ${
            done
              ? "border-indigo-600 bg-indigo-600 text-white"
              : "border-slate-300"
          }`}
        >
          {done && <Check size={14} strokeWidth={3} />}
        </button>
      </div>
    </div>
  );
}
