import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Info, Pencil, User as UserIcon } from "lucide-react";
import BlackboardCard from "../components/BlackboardCard";
import ClassPlace from "../components/ClassPlace";
import SyncBadge from "../components/SyncBadge";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { courseColorClass } from "../lib/courseColors";

const DAY_NAMES = [
  "",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const hhmm = (time) => time.slice(0, 5);

function toMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Busca la próxima clase que aún no terminó, empezando por hoy y mirando hasta 7 días
function findNextClass(sessions) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const todayId = now.getDay() === 0 ? 7 : now.getDay();

  for (let offset = 0; offset < 7; offset++) {
    const dayId = ((todayId - 1 + offset) % 7) + 1;
    const candidate = sessions.find(
      (s) =>
        s.day_of_week === dayId &&
        (offset > 0 || toMinutes(s.end_time) > nowMinutes),
    );
    if (candidate) return { session: candidate, offset, dayId };
  }
  return null;
}

export default function Inicio() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [nextClass, setNextClass] = useState(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function load() {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const [profileRes, tasksRes, sessionsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, avatar_url, semester_goal")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("tasks")
          .select("id, status")
          .gte("due_at", start.toISOString())
          .lt("due_at", end.toISOString()),
        supabase
          .from("class_sessions")
          .select(
            "id, day_of_week, start_time, end_time, location, meeting_url, source, course:courses(name, color, professor)",
          )
          .order("start_time", { ascending: true }),
      ]);

      const firstError =
        profileRes.error || tasksRes.error || sessionsRes.error;
      if (firstError) setError(firstError.message);

      setProfile(profileRes.data);
      setTodayTasks(tasksRes.data ?? []);
      setNextClass(findNextClass(sessionsRes.data ?? []));
      setLoading(false);
    }
    load();
  }, [user.id, reloadKey]);

  async function saveGoal() {
    const goal = goalDraft.trim() || null;
    const { error } = await supabase
      .from("profiles")
      .update({ semester_goal: goal })
      .eq("id", user.id);

    if (error) {
      setError(error.message);
      return;
    }
    setProfile((p) => ({ ...p, semester_goal: goal }));
    setEditingGoal(false);
  }

  const fullName = profile?.full_name || user.email;
  const firstName = fullName.split(/[\s@]/)[0];
  const initial = firstName.charAt(0).toUpperCase();

  const dateText = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const total = todayTasks.length;
  const done = todayTasks.filter((t) => t.status === "completada").length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  if (loading) return <p className="text-slate-500">Cargando...</p>;

  const session = nextClass?.session;
  const whenLabel =
    nextClass?.offset === 0
      ? hhmm(session.start_time)
      : nextClass?.offset === 1
        ? `Mañana · ${hhmm(session.start_time)}`
        : `${DAY_NAMES[nextClass?.dayId]} · ${hhmm(session?.start_time ?? "00:00")}`;

  return (
    <div>
      {/* Saludo */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            ¡Hola, {firstName}!
          </h1>
          <p className="mt-1 text-slate-500 first-letter:uppercase">
            {dateText}
          </p>
        </div>
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Foto de perfil"
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
            {initial}
          </div>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {/* Meta del semestre */}
      <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-indigo-600">
            <Info size={16} />
            Meta del semestre
          </div>
          {!editingGoal && (
            <button
              onClick={() => {
                setGoalDraft(profile?.semester_goal ?? "");
                setEditingGoal(true);
              }}
              aria-label="Editar meta"
              className="text-indigo-400"
            >
              <Pencil size={16} />
            </button>
          )}
        </div>

        {editingGoal ? (
          <div className="mt-3">
            <textarea
              rows={4}
              value={goalDraft}
              onChange={(e) => setGoalDraft(e.target.value)}
              placeholder="Escribe tu meta para este semestre"
              className="w-full rounded-xl border border-indigo-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => setEditingGoal(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-500"
              >
                Cancelar
              </button>
              <button
                onClick={saveGoal}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white"
              >
                Guardar
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {profile?.semester_goal ||
              "Aún no defines tu meta. Toca el lápiz para escribirla."}
          </p>
        )}
      </div>

      {/* Resumen de hoy */}
      <h2 className="mt-8 text-lg font-bold text-slate-900">Resumen de Hoy</h2>
      <div className="mt-3 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
          {percent}%
        </div>
        <div>
          <p className="font-semibold text-slate-900">Tareas completadas</p>
          <p className="text-sm text-slate-500">
            {total === 0
              ? "No tienes entregas para hoy"
              : `${done} de ${total} tareas finalizadas`}
          </p>
        </div>
      </div>

      {/* Próxima clase */}
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Próxima Clase</h2>
        <Link to="/horario" className="text-sm font-medium text-indigo-600">
          Ver horario
        </Link>
      </div>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
        {session ? (
          <>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-medium ${courseColorClass(session.course?.color)}`}
                >
                  {session.course?.name}
                </span>
                <SyncBadge source={session.source} />
              </span>
            </div>

            <h3 className="mt-3 font-semibold text-slate-900">
              {session.course?.name}
            </h3>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <ClassPlace session={session} />
              {session.course?.professor && (
                <span className="flex items-center gap-1">
                  <UserIcon size={14} />
                  {session.course.professor}
                </span>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400">
            No tienes clases programadas.
          </p>
        )}
      </div>

      <BlackboardCard onChanged={() => setReloadKey((k) => k + 1)} />
        
      <button
        onClick={signOut}
        className="mt-10 w-full py-2 text-center text-sm text-slate-400"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
