import { useState, useEffect, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

const STORAGE_KEY = "studentApp_v1";

const defaultData = {
  courses: [
    { id: 1, name: "Mathématiques", coefficient: 3, scale: 20, grades: [14, 12, 16], color: "#4ade80" },
    { id: 2, name: "Physique", coefficient: 2, scale: 20, grades: [11, 15], color: "#86efac" },
    { id: 3, name: "Histoire", coefficient: 2, scale: 20, grades: [13, 17, 14], color: "#6ee7b7" },
    { id: 4, name: "Anglais", coefficient: 1, scale: 20, grades: [18, 16], color: "#a3e635" },
  ],
  tasks: [
    { id: 1, text: "Rendre le devoir de maths", done: false, priority: "high", time: "09:00", date: new Date().toISOString().split("T")[0] },
    { id: 2, text: "Lire chapitre 5 d'histoire", done: false, priority: "medium", time: "14:00", date: new Date().toISOString().split("T")[0] },
    { id: 3, text: "Préparer exposé de physique", done: true, priority: "low", time: "16:00", date: new Date().toISOString().split("T")[0] },
  ],
  revisions: [
    { id: 1, subject: "Mathématiques", topic: "Intégrales", duration: 60, done: false, date: new Date().toISOString().split("T")[0] },
    { id: 2, subject: "Physique", topic: "Thermodynamique", duration: 45, done: false, date: new Date().toISOString().split("T")[0] },
  ],
  sport: [
    { id: 1, name: "Course à pied", duration: 30, calories: 300, sets: null, reps: null, date: new Date().toISOString().split("T")[0], type: "cardio" },
    { id: 2, name: "Pompes", duration: 15, calories: 120, sets: 4, reps: 15, date: new Date().toISOString().split("T")[0], type: "muscu" },
  ],
  weekTasks: {},
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultData;
  } catch { return defaultData; }
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "⬡" },
  { id: "courses", label: "Cours & Notes", icon: "◈" },
  { id: "revisions", label: "Révisions", icon: "◎" },
  { id: "tasks", label: "Tâches", icon: "◇" },
  { id: "sport", label: "Sport", icon: "◉" },
];

const priorityColors = { high: "#ef4444", medium: "#f59e0b", low: "#4ade80" };
const priorityLabels = { high: "Urgent", medium: "Normal", low: "Faible" };

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function toBase20(grade, scale) {
  return (grade / (scale || 20)) * 20;
}

function avgBase20(grades, scale) {
  if (!grades.length) return 0;
  return toBase20(avg(grades), scale);
}

const SCALES = [4, 5, 10, 20, 100];

function weightedAvg(courses) {
  let total = 0, coefSum = 0;
  courses.forEach(c => {
    if (c.grades.length) {
      total += avgBase20(c.grades, c.scale || 20) * c.coefficient;
      coefSum += c.coefficient;
    }
  });
  return coefSum ? (total / coefSum).toFixed(2) : "—";
}

// ─── COMPONENTS ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #1a1f1a 0%, #141914 100%)",
      border: `1px solid ${accent || "#2d3a2d"}`,
      borderRadius: 16,
      padding: "20px 24px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80,
        background: `radial-gradient(circle, ${accent || "#4ade8020"} 0%, transparent 70%)`,
        borderRadius: "0 16px 0 80px" }} />
      <div style={{ fontSize: 12, color: "#6b7c6b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 800, color: accent || "#4ade80", fontFamily: "'Courier New', monospace", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#4a5a4a", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function Dashboard({ data }) {
  const general = weightedAvg(data.courses);
  const todayTasks = data.tasks.filter(t => t.date === new Date().toISOString().split("T")[0]);
  const doneTasks = todayTasks.filter(t => t.done).length;
  const todaySport = data.sport.filter(s => s.date === new Date().toISOString().split("T")[0]);
  const totalCals = todaySport.reduce((a, s) => a + (s.calories || 0), 0);
  const todayRevs = data.revisions.filter(r => r.date === new Date().toISOString().split("T")[0]);
  const doneRevs = todayRevs.filter(r => r.done).length;

  const radarData = data.courses.map(c => ({
    subject: c.name.substring(0, 5),
    value: parseFloat(avgBase20(c.grades, c.scale || 20).toFixed(1)),
  }));

  const gradeHistory = data.courses[0]?.grades.map((_, i) => {
    const obj = { index: `Note ${i + 1}` };
    data.courses.forEach(c => { obj[c.name] = c.grades[i] || null; });
    return obj;
  }) || [];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: 4, textTransform: "uppercase", marginBottom: 8 }}>
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: "#e8f5e8", margin: 0, fontFamily: "'Courier New', monospace" }}>
          Bonjour, Étudiant ◈
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        <StatCard label="Moyenne Générale" value={general} sub={`sur ${data.courses.length} matières`} accent="#4ade80" />
        <StatCard label="Tâches Aujourd'hui" value={`${doneTasks}/${todayTasks.length}`} sub="complétées" accent="#86efac" />
        <StatCard label="Révisions Today" value={`${doneRevs}/${todayRevs.length}`} sub="sessions" accent="#6ee7b7" />
        <StatCard label="Calories Brûlées" value={totalCals} sub="aujourd'hui" accent="#a3e635" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "#141914", border: "1px solid #2d3a2d", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Performance par matière</div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#2d3a2d" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7c6b", fontSize: 11 }} />
              <Radar dataKey="value" stroke="#4ade80" fill="#4ade80" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "#141914", border: "1px solid #2d3a2d", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Tâches urgentes</div>
          {data.tasks.filter(t => !t.done && t.priority === "high").slice(0, 4).map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #1e281e" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#c8d8c8" }}>{t.text}</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#4a5a4a" }}>{t.time}</span>
            </div>
          ))}
          {data.tasks.filter(t => !t.done && t.priority === "high").length === 0 && (
            <div style={{ fontSize: 13, color: "#4a5a4a", textAlign: "center", paddingTop: 40 }}>✓ Aucune tâche urgente</div>
          )}
        </div>
      </div>
    </div>
  );
}

function CoursesTab({ data, setData }) {
  const [newCourse, setNewCourse] = useState({ name: "", coefficient: 1, scale: 20 });
  const [newGrade, setNewGrade] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [editingScale, setEditingScale] = useState(null); // courseId being edited
  const [customScale, setCustomScale] = useState("");

  const addCourse = () => {
    if (!newCourse.name.trim()) return;
    const colors = ["#4ade80", "#86efac", "#6ee7b7", "#a3e635", "#84cc16"];
    const updated = { ...data, courses: [...data.courses, { id: Date.now(), name: newCourse.name, coefficient: Number(newCourse.coefficient), scale: Number(newCourse.scale) || 20, grades: [], color: colors[data.courses.length % colors.length] }] };
    setData(updated); setNewCourse({ name: "", coefficient: 1, scale: 20 }); setShowAdd(false);
  };

  const addGrade = (courseId) => {
    const course = data.courses.find(c => c.id === courseId);
    const scale = course?.scale || 20;
    const val = parseFloat(newGrade[courseId]);
    if (isNaN(val) || val < 0 || val > scale) return;
    const updated = { ...data, courses: data.courses.map(c => c.id === courseId ? { ...c, grades: [...c.grades, val] } : c) };
    setData(updated); setNewGrade(prev => ({ ...prev, [courseId]: "" }));
  };

  const removeGrade = (courseId, idx) => {
    const updated = { ...data, courses: data.courses.map(c => c.id === courseId ? { ...c, grades: c.grades.filter((_, i) => i !== idx) } : c) };
    setData(updated);
  };

  const removeCourse = (id) => {
    setData({ ...data, courses: data.courses.filter(c => c.id !== id) });
  };

  const applyScale = (courseId, scale) => {
    const s = Number(scale);
    if (!s || s < 1) return;
    setData({ ...data, courses: data.courses.map(c => c.id === courseId ? { ...c, scale: s } : c) });
    setEditingScale(null); setCustomScale("");
  };

  const general = weightedAvg(data.courses);

  // Bar chart: all normalized to /20 for fair comparison
  const barData = data.courses.map(c => ({
    name: c.name.substring(0, 8),
    "Moy. /20": parseFloat(avgBase20(c.grades, c.scale || 20).toFixed(2)),
    "Moy. brute": parseFloat(avg(c.grades).toFixed(2)),
    scale: c.scale || 20,
  }));

  const passThreshold = (scale) => scale === 20 ? 10 : scale === 10 ? 5 : scale === 4 ? 2 : scale === 100 ? 50 : scale / 2;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h3 style={{ color: "#e8f5e8", margin: 0, fontSize: 20, fontWeight: 800 }}>Cours & Notes</h3>
          <div style={{ color: "#4a5a4a", fontSize: 13, marginTop: 4 }}>
            Moyenne générale pondérée (ramenée /20) : <span style={{ color: "#4ade80", fontWeight: 700, fontSize: 18 }}>{general}/20</span>
          </div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ background: "#4ade8015", border: "1px solid #4ade80", color: "#4ade80", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
          {showAdd ? "✕ Annuler" : "+ Ajouter matière"}
        </button>
      </div>

      {showAdd && (
        <div style={{ background: "#141914", border: "1px solid #4ade8040", borderRadius: 12, padding: 16, marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input placeholder="Nom de la matière" value={newCourse.name} onChange={e => setNewCourse(p => ({ ...p, name: e.target.value }))}
            style={{ flex: 2, background: "#0f130f", border: "1px solid #2d3a2d", color: "#c8d8c8", padding: "8px 12px", borderRadius: 8, fontSize: 13, minWidth: 140 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <label style={{ fontSize: 10, color: "#4a5a4a", letterSpacing: 1 }}>COEFF.</label>
            <input type="number" value={newCourse.coefficient} onChange={e => setNewCourse(p => ({ ...p, coefficient: e.target.value }))} min={1} max={10}
              style={{ width: 70, background: "#0f130f", border: "1px solid #2d3a2d", color: "#c8d8c8", padding: "8px 10px", borderRadius: 8, fontSize: 13 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <label style={{ fontSize: 10, color: "#4a5a4a", letterSpacing: 1 }}>BARÈME</label>
            <select value={newCourse.scale} onChange={e => setNewCourse(p => ({ ...p, scale: e.target.value }))}
              style={{ background: "#0f130f", border: "1px solid #2d3a2d", color: "#c8d8c8", padding: "8px 10px", borderRadius: 8, fontSize: 13 }}>
              {SCALES.map(s => <option key={s} value={s}>/{s}</option>)}
            </select>
          </div>
          <button onClick={addCourse} style={{ background: "#4ade80", color: "#0a0f0a", padding: "8px 16px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, alignSelf: "flex-end" }}>Ajouter</button>
        </div>
      )}

      <div style={{ background: "#141914", border: "1px solid #2d3a2d", borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Comparaison des moyennes</div>
        <div style={{ fontSize: 11, color: "#4a5a4a", marginBottom: 16 }}>Toutes les notes sont ramenées sur 20 pour comparaison équitable</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e281e" />
            <XAxis dataKey="name" tick={{ fill: "#6b7c6b", fontSize: 11 }} />
            <YAxis domain={[0, 20]} tick={{ fill: "#6b7c6b", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "#141914", border: "1px solid #4ade80", color: "#c8d8c8", borderRadius: 8 }}
              formatter={(val, name, props) => [`${val}/20`, "Moyenne /20"]} />
            <Bar dataKey="Moy. /20" fill="#4ade80" radius={[6, 6, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {data.courses.map(course => {
          const scale = course.scale || 20;
          const courseAvg = avg(course.grades);
          const courseAvg20 = avgBase20(course.grades, scale);
          const pass = passThreshold(scale);
          const avgColor = courseAvg20 >= 14 ? "#4ade80" : courseAvg20 >= 10 ? "#f59e0b" : "#ef4444";
          const isEditing = editingScale === course.id;

          return (
            <div key={course.id} style={{ background: "#141914", border: `1px solid ${course.color}30`, borderRadius: 16, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: course.color, flexShrink: 0 }} />
                    <span style={{ color: "#e8f5e8", fontWeight: 700, fontSize: 16 }}>{course.name}</span>
                    <span style={{ fontSize: 11, color: "#4a5a4a", background: "#1e281e", padding: "2px 8px", borderRadius: 20 }}>coeff. {course.coefficient}</span>
                    {/* Scale badge + edit */}
                    {!isEditing ? (
                      <button onClick={() => { setEditingScale(course.id); setCustomScale(String(scale)); }}
                        style={{ fontSize: 11, color: "#4ade80", background: "#4ade8015", border: "1px solid #4ade8040", padding: "2px 8px", borderRadius: 20, cursor: "pointer" }}>
                        /{scale} ✎
                      </button>
                    ) : (
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "#6b7c6b" }}>Barème :</span>
                        {SCALES.map(s => (
                          <button key={s} onClick={() => applyScale(course.id, s)}
                            style={{ padding: "2px 8px", borderRadius: 20, border: `1px solid ${s === scale ? "#4ade80" : "#2d3a2d"}`, background: s === scale ? "#4ade8020" : "transparent", color: s === scale ? "#4ade80" : "#6b7c6b", cursor: "pointer", fontSize: 11 }}>
                            /{s}
                          </button>
                        ))}
                        <input type="number" placeholder="Perso." value={customScale} onChange={e => setCustomScale(e.target.value)} min={1}
                          style={{ width: 60, background: "#0f130f", border: "1px solid #2d3a2d", color: "#c8d8c8", padding: "2px 6px", borderRadius: 8, fontSize: 11 }} />
                        <button onClick={() => applyScale(course.id, customScale)}
                          style={{ background: "#4ade80", color: "#0a0f0a", border: "none", borderRadius: 8, padding: "2px 8px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>OK</button>
                        <button onClick={() => setEditingScale(null)} style={{ background: "none", border: "none", color: "#4a5a4a", cursor: "pointer", fontSize: 13 }}>✕</button>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#4a5a4a", marginTop: 4 }}>{course.grades.length} note(s) · seuil de passage : {pass}/{scale}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: avgColor, fontFamily: "'Courier New', monospace" }}>
                      {course.grades.length ? courseAvg.toFixed(1) : "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "#4a5a4a" }}>/{scale}</div>
                    {scale !== 20 && course.grades.length > 0 && (
                      <div style={{ fontSize: 11, color: "#6b7c6b", marginTop: 2 }}>= {courseAvg20.toFixed(1)}/20</div>
                    )}
                  </div>
                  <button onClick={() => removeCourse(course.id)} style={{ background: "none", border: "none", color: "#4a5a4a", cursor: "pointer", fontSize: 16, padding: 4 }}>✕</button>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {course.grades.map((g, i) => {
                  const g20 = toBase20(g, scale);
                  return (
                    <div key={i} onClick={() => removeGrade(course.id, i)}
                      style={{ background: "#1e281e", border: "1px solid #2d3a2d", borderRadius: 8, padding: "4px 10px", fontSize: 13, color: g >= pass ? "#86efac" : "#f87171", cursor: "pointer" }}
                      title={`${g}/${scale} = ${g20.toFixed(1)}/20 — Clic pour supprimer`}>
                      {g}/{scale}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" placeholder={`Ajouter une note (0-${scale})`} value={newGrade[course.id] || ""}
                  onChange={e => setNewGrade(p => ({ ...p, [course.id]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && addGrade(course.id)} min={0} max={scale} step={0.5}
                  style={{ flex: 1, background: "#0f130f", border: "1px solid #2d3a2d", color: "#c8d8c8", padding: "7px 12px", borderRadius: 8, fontSize: 13 }} />
                <button onClick={() => addGrade(course.id)} style={{ background: course.color + "20", border: `1px solid ${course.color}`, color: course.color, padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>+ Note</button>
              </div>

              {course.grades.length > 1 && (
                <div style={{ marginTop: 12 }}>
                  <ResponsiveContainer width="100%" height={60}>
                    <LineChart data={course.grades.map((g, i) => ({ n: i + 1, note: g, sur20: parseFloat(toBase20(g, scale).toFixed(1)) }))}>
                      <Line type="monotone" dataKey="note" stroke={course.color} strokeWidth={2} dot={{ fill: course.color, r: 3 }} />
                      <YAxis domain={[0, scale]} hide />
                      <Tooltip contentStyle={{ background: "#141914", border: `1px solid ${course.color}`, color: "#c8d8c8", borderRadius: 8, fontSize: 12 }}
                        formatter={(val, name, props) => [`${val}/${scale} (= ${props.payload.sur20}/20)`]} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RevisionsTab({ data, setData }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ subject: "", topic: "", duration: 30, date: new Date().toISOString().split("T")[0] });

  const add = () => {
    if (!form.subject || !form.topic) return;
    setData({ ...data, revisions: [...data.revisions, { id: Date.now(), ...form, duration: Number(form.duration), done: false }] });
    setForm({ subject: "", topic: "", duration: 30, date: new Date().toISOString().split("T")[0] });
    setShowAdd(false);
  };

  const toggle = (id) => setData({ ...data, revisions: data.revisions.map(r => r.id === id ? { ...r, done: !r.done } : r) });
  const remove = (id) => setData({ ...data, revisions: data.revisions.filter(r => r.id !== id) });

  const today = new Date().toISOString().split("T")[0];
  const todayRevs = data.revisions.filter(r => r.date === today);
  const otherRevs = data.revisions.filter(r => r.date !== today);
  const totalMins = todayRevs.filter(r => r.done).reduce((a, r) => a + r.duration, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h3 style={{ color: "#e8f5e8", margin: 0, fontSize: 20, fontWeight: 800 }}>Planning de Révisions</h3>
          <div style={{ color: "#4a5a4a", fontSize: 13, marginTop: 4 }}>
            {totalMins} min révisées aujourd'hui · {todayRevs.filter(r => r.done).length}/{todayRevs.length} sessions
          </div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ background: "#4ade8015", border: "1px solid #4ade80", color: "#4ade80", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
          {showAdd ? "✕" : "+ Session"}
        </button>
      </div>

      {showAdd && (
        <div style={{ background: "#141914", border: "1px solid #4ade8040", borderRadius: 12, padding: 16, marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input placeholder="Matière" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
            style={{ background: "#0f130f", border: "1px solid #2d3a2d", color: "#c8d8c8", padding: "8px 12px", borderRadius: 8, fontSize: 13 }} />
          <input placeholder="Sujet / Chapitre" value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))}
            style={{ background: "#0f130f", border: "1px solid #2d3a2d", color: "#c8d8c8", padding: "8px 12px", borderRadius: 8, fontSize: 13 }} />
          <input type="number" placeholder="Durée (min)" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} min={5}
            style={{ background: "#0f130f", border: "1px solid #2d3a2d", color: "#c8d8c8", padding: "8px 12px", borderRadius: 8, fontSize: 13 }} />
          <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
            style={{ background: "#0f130f", border: "1px solid #2d3a2d", color: "#c8d8c8", padding: "8px 12px", borderRadius: 8, fontSize: 13 }} />
          <button onClick={add} style={{ gridColumn: "1/-1", background: "#4ade80", color: "#0a0f0a", padding: "9px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Ajouter la session</button>
        </div>
      )}

      {todayRevs.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Aujourd'hui</div>
          <div style={{ display: "grid", gap: 10 }}>
            {todayRevs.map(r => (
              <div key={r.id} style={{ background: r.done ? "#141914" : "#1a1f1a", border: `1px solid ${r.done ? "#2d3a2d" : "#4ade8040"}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={() => toggle(r.id)} style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${r.done ? "#4ade80" : "#2d3a2d"}`, background: r.done ? "#4ade80" : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#0a0f0a" }}>
                  {r.done ? "✓" : ""}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ color: r.done ? "#4a5a4a" : "#c8d8c8", fontWeight: 600, textDecoration: r.done ? "line-through" : "none" }}>{r.topic}</div>
                  <div style={{ fontSize: 12, color: "#4a5a4a" }}>{r.subject} · {r.duration} min</div>
                </div>
                <div style={{ fontSize: 13, color: "#4ade80", fontFamily: "monospace" }}>{r.duration}'</div>
                <button onClick={() => remove(r.id)} style={{ background: "none", border: "none", color: "#4a5a4a", cursor: "pointer", fontSize: 14 }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {otherRevs.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: "#6b7c6b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Autres jours</div>
          <div style={{ display: "grid", gap: 10 }}>
            {otherRevs.map(r => (
              <div key={r.id} style={{ background: "#141914", border: "1px solid #2d3a2d", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, opacity: 0.7 }}>
                <button onClick={() => toggle(r.id)} style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${r.done ? "#4ade80" : "#2d3a2d"}`, background: r.done ? "#4ade80" : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#0a0f0a" }}>
                  {r.done ? "✓" : ""}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#8a9a8a", fontWeight: 600 }}>{r.topic}</div>
                  <div style={{ fontSize: 12, color: "#4a5a4a" }}>{r.subject} · {r.date}</div>
                </div>
                <button onClick={() => remove(r.id)} style={{ background: "none", border: "none", color: "#4a5a4a", cursor: "pointer", fontSize: 14 }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── WEEK PLANNER ──────────────────────────────────────────────────────────────
const WEEK_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const DAY_KEYS  = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06:00 → 22:00

function pad(n) { return String(n).padStart(2, "0"); }

function WeekPlanner({ data, setData }) {
  const todayIdx = ((new Date().getDay() + 6) % 7); // 0=Mon … 6=Sun
  const [activeDay, setActiveDay] = useState(todayIdx);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]   = useState({ text: "", priority: "medium", timeStart: "08:00", timeEnd: "09:00", repeat: false });
  const [editId, setEditId] = useState(null);
  const scrollRef = useRef(null);

  // weekly tasks stored separately in data.weekTasks: { monday: [...], tuesday: [...], ... }
  const weekTasks = data.weekTasks || {};
  const dayKey    = DAY_KEYS[activeDay];
  const dayTasks  = (weekTasks[dayKey] || []).slice().sort((a,b) => a.timeStart.localeCompare(b.timeStart));

  const saveWeek = (updated) => setData({ ...data, weekTasks: updated });

  const addTask = () => {
    if (!form.text.trim()) return;
    const wt = { ...weekTasks };
    if (!wt[dayKey]) wt[dayKey] = [];
    if (editId) {
      wt[dayKey] = wt[dayKey].map(t => t.id === editId ? { ...t, ...form } : t);
      setEditId(null);
    } else {
      wt[dayKey] = [...wt[dayKey], { id: Date.now(), ...form, done: false }];
    }
    saveWeek(wt);
    setForm({ text: "", priority: "medium", timeStart: "08:00", timeEnd: "09:00", repeat: false });
    setShowForm(false);
  };

  const toggleTask = (id) => {
    const wt = { ...weekTasks, [dayKey]: (weekTasks[dayKey]||[]).map(t => t.id===id ? {...t, done:!t.done} : t) };
    saveWeek(wt);
  };

  const removeTask = (id) => {
    const wt = { ...weekTasks, [dayKey]: (weekTasks[dayKey]||[]).filter(t => t.id!==id) };
    saveWeek(wt);
  };

  const startEdit = (task) => {
    setForm({ text: task.text, priority: task.priority, timeStart: task.timeStart, timeEnd: task.timeEnd, repeat: task.repeat||false });
    setEditId(task.id);
    setShowForm(true);
  };

  // stats for active day
  const total = dayTasks.length;
  const done  = dayTasks.filter(t=>t.done).length;
  const pct   = total ? Math.round((done/total)*100) : 0;

  // position task on timeline
  const timeToMin = (t) => { const [h,m]=t.split(":").map(Number); return h*60+m; };
  const TIMELINE_START = 6*60; // 06:00
  const TIMELINE_END   = 22*60;
  const TIMELINE_H     = TIMELINE_END - TIMELINE_START; // 960 min

  // current time line
  const now = new Date();
  const nowMin = now.getHours()*60+now.getMinutes();
  const nowPct = Math.max(0, Math.min(100, ((nowMin - TIMELINE_START)/TIMELINE_H)*100));
  const isToday = activeDay === todayIdx;

  // color per priority
  const pc = { high:"#ef4444", medium:"#f59e0b", low:"#4ade80" };

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h3 style={{ color:"#e8f5e8", margin:0, fontSize:20, fontWeight:800 }}>Planning Hebdomadaire</h3>
          <div style={{ color:"#4a5a4a", fontSize:13, marginTop:4 }}>{WEEK_DAYS[activeDay]} · {done}/{total} tâches · {pct}%</div>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ text:"", priority:"medium", timeStart:"08:00", timeEnd:"09:00", repeat:false }); }}
          style={{ background:"#4ade8015", border:"1px solid #4ade80", color:"#4ade80", padding:"8px 16px", borderRadius:8, cursor:"pointer", fontSize:13 }}>
          {showForm ? "✕" : "+ Tâche"}
        </button>
      </div>

      {/* Day tabs */}
      <div style={{ display:"flex", gap:0, marginBottom:24, background:"#141914", borderRadius:12, padding:4, overflowX:"auto" }}>
        {WEEK_DAYS.map((d, i) => {
          const dk = DAY_KEYS[i];
          const cnt = (weekTasks[dk]||[]).length;
          const doneD = (weekTasks[dk]||[]).filter(t=>t.done).length;
          const isActive = i === activeDay;
          const isT = i === todayIdx;
          return (
            <button key={d} onClick={() => setActiveDay(i)} style={{
              flex:1, minWidth:72, padding:"8px 4px", border:"none", borderRadius:9, cursor:"pointer",
              background: isActive ? "#2d3a2d" : "transparent",
              color: isActive ? "#4ade80" : isT ? "#86efac" : "#4a5a4a",
              fontWeight: isActive ? 700 : 400, fontSize:12, position:"relative",
              transition:"all 0.2s",
            }}>
              <div>{d.substring(0,3)}</div>
              {isT && <div style={{ fontSize:9, color:"#4ade8080" }}>Auj.</div>}
              {cnt > 0 && <div style={{ fontSize:9, color: doneD===cnt ? "#4ade80" : "#6b7c6b" }}>{doneD}/{cnt}</div>}
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div style={{ background:"#141914", border:"1px solid #2d3a2d", borderRadius:12, padding:"10px 16px", marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:12, color:"#6b7c6b" }}>Progression {WEEK_DAYS[activeDay]}</span>
            <span style={{ fontSize:12, color:"#4ade80", fontFamily:"monospace" }}>{pct}%</span>
          </div>
          <div style={{ background:"#1e281e", borderRadius:100, height:5, overflow:"hidden" }}>
            <div style={{ width:`${pct}%`, height:"100%", background:"linear-gradient(90deg,#4ade80,#86efac)", borderRadius:100, transition:"width 0.5s" }} />
          </div>
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <div style={{ background:"#141914", border:"1px solid #4ade8050", borderRadius:14, padding:18, marginBottom:22 }}>
          <div style={{ fontSize:12, color:"#4ade80", letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>
            {editId ? "Modifier la tâche" : `Nouvelle tâche — ${WEEK_DAYS[activeDay]}`}
          </div>
          <input placeholder="Description de la tâche..." value={form.text} onChange={e => setForm(p=>({...p,text:e.target.value}))}
            style={{ width:"100%", background:"#0f130f", border:"1px solid #2d3a2d", color:"#c8d8c8", padding:"9px 12px", borderRadius:8, fontSize:14, marginBottom:10, boxSizing:"border-box" }} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:10 }}>
            <div>
              <div style={{ fontSize:10, color:"#4a5a4a", marginBottom:4, letterSpacing:1 }}>DÉBUT</div>
              <input type="time" value={form.timeStart} onChange={e => setForm(p=>({...p,timeStart:e.target.value}))}
                style={{ width:"100%", background:"#0f130f", border:"1px solid #2d3a2d", color:"#c8d8c8", padding:"8px 10px", borderRadius:8, fontSize:13 }} />
            </div>
            <div>
              <div style={{ fontSize:10, color:"#4a5a4a", marginBottom:4, letterSpacing:1 }}>FIN</div>
              <input type="time" value={form.timeEnd} onChange={e => setForm(p=>({...p,timeEnd:e.target.value}))}
                style={{ width:"100%", background:"#0f130f", border:"1px solid #2d3a2d", color:"#c8d8c8", padding:"8px 10px", borderRadius:8, fontSize:13 }} />
            </div>
            <div>
              <div style={{ fontSize:10, color:"#4a5a4a", marginBottom:4, letterSpacing:1 }}>PRIORITÉ</div>
              <select value={form.priority} onChange={e => setForm(p=>({...p,priority:e.target.value}))}
                style={{ width:"100%", background:"#0f130f", border:"1px solid #2d3a2d", color:"#c8d8c8", padding:"8px 10px", borderRadius:8, fontSize:13 }}>
                <option value="high">🔴 Urgent</option>
                <option value="medium">🟡 Normal</option>
                <option value="low">🟢 Faible</option>
              </select>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
            <input type="checkbox" id="repeat" checked={form.repeat} onChange={e=>setForm(p=>({...p,repeat:e.target.checked}))}
              style={{ accentColor:"#4ade80", width:16, height:16, cursor:"pointer" }} />
            <label htmlFor="repeat" style={{ fontSize:13, color:"#8a9a8a", cursor:"pointer" }}>Tâche récurrente (se répète chaque semaine)</label>
          </div>
          <button onClick={addTask} style={{ width:"100%", background:"#4ade80", color:"#0a0f0a", padding:"10px", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:14 }}>
            {editId ? "Enregistrer les modifications" : "Ajouter la tâche"}
          </button>
        </div>
      )}

      {/* Timeline view */}
      <div style={{ display:"grid", gridTemplateColumns:"44px 1fr", gap:0 }}>
        {/* Hour labels */}
        <div style={{ position:"relative" }}>
          {HOURS.map(h => (
            <div key={h} style={{ height:56, display:"flex", alignItems:"flex-start", paddingTop:2 }}>
              <span style={{ fontSize:10, color:"#3a4a3a", fontFamily:"monospace" }}>{pad(h)}:00</span>
            </div>
          ))}
        </div>

        {/* Timeline column */}
        <div style={{ position:"relative", borderLeft:"1px solid #1e281e" }}>
          {/* Hour lines */}
          {HOURS.map(h => (
            <div key={h} style={{ height:56, borderTop:"1px solid #1a221a", position:"relative" }}>
              <div style={{ position:"absolute", top:"50%", left:0, right:0, height:1, background:"#141914", opacity:0.5 }} />
            </div>
          ))}

          {/* Current time indicator */}
          {isToday && nowMin >= TIMELINE_START && nowMin <= TIMELINE_END && (
            <div style={{ position:"absolute", top:`${((nowMin-TIMELINE_START)/TIMELINE_H)*100}%`, left:0, right:0, zIndex:10, pointerEvents:"none" }}>
              <div style={{ height:2, background:"#4ade80", boxShadow:"0 0 8px #4ade80" }} />
              <div style={{ position:"absolute", left:-5, top:-4, width:10, height:10, borderRadius:"50%", background:"#4ade80", boxShadow:"0 0 6px #4ade80" }} />
              <span style={{ position:"absolute", right:6, top:-8, fontSize:10, color:"#4ade80", fontFamily:"monospace", background:"#0a0f0a", padding:"0 4px" }}>
                {pad(now.getHours())}:{pad(now.getMinutes())}
              </span>
            </div>
          )}

          {/* Task blocks */}
          {dayTasks.map((task, idx) => {
            const startMin = timeToMin(task.timeStart);
            const endMin   = timeToMin(task.timeEnd);
            const topPct   = Math.max(0, ((startMin - TIMELINE_START)/TIMELINE_H)*100);
            const heightPct= Math.max(1, ((endMin - startMin)/TIMELINE_H)*100);
            const color    = pc[task.priority] || "#4ade80";
            const dur      = endMin - startMin;

            return (
              <div key={task.id} style={{
                position:"absolute",
                top:`${topPct}%`,
                left:8,
                right:8,
                height:`calc(${heightPct}% - 3px)`,
                minHeight:28,
                background:`linear-gradient(135deg, ${color}18, ${color}0a)`,
                border:`1px solid ${color}${task.done ? "40" : "70"}`,
                borderLeft:`3px solid ${color}${task.done ? "50" : ""}`,
                borderRadius:8,
                padding:"4px 8px",
                zIndex:5,
                cursor:"pointer",
                overflow:"hidden",
                opacity: task.done ? 0.5 : 1,
                transition:"opacity 0.2s",
              }}
                onClick={() => startEdit(task)}
                title={`${task.timeStart}–${task.timeEnd} | ${task.text}`}
              >
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <button onClick={e => { e.stopPropagation(); toggleTask(task.id); }}
                    style={{ width:14, height:14, borderRadius:4, border:`1.5px solid ${color}`, background: task.done ? color : "transparent", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#0a0f0a" }}>
                    {task.done ? "✓" : ""}
                  </button>
                  <span style={{ fontSize:12, fontWeight:600, color: task.done ? "#4a5a4a" : "#c8d8c8", textDecoration: task.done ? "line-through" : "none", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {task.text}
                  </span>
                  {task.repeat && <span style={{ fontSize:9, color:color, flexShrink:0 }}>↻</span>}
                  <button onClick={e => { e.stopPropagation(); removeTask(task.id); }}
                    style={{ marginLeft:"auto", background:"none", border:"none", color:"#4a5a4a", cursor:"pointer", fontSize:12, flexShrink:0, padding:0 }}>✕</button>
                </div>
                {dur >= 45 && (
                  <div style={{ fontSize:10, color:"#4a5a4a", marginTop:2, paddingLeft:20 }}>
                    {task.timeStart} → {task.timeEnd} · {dur}min
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {dayTasks.length === 0 && (
        <div style={{ textAlign:"center", color:"#2d3a2d", padding:"40px 0", fontSize:14 }}>
          Aucune tâche ce {WEEK_DAYS[activeDay].toLowerCase()} — clique sur + Tâche pour en ajouter
        </div>
      )}
    </div>
  );
}

function TasksTab({ data, setData }) {
  const [view, setView] = useState("week"); // "week" | "list"
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ text: "", priority: "medium", time: "09:00", date: new Date().toISOString().split("T")[0] });
  const [filter, setFilter] = useState("all");

  const add = () => {
    if (!form.text.trim()) return;
    setData({ ...data, tasks: [...data.tasks, { id: Date.now(), ...form, done: false }] });
    setForm({ text: "", priority: "medium", time: "09:00", date: new Date().toISOString().split("T")[0] });
    setShowAdd(false);
  };

  const toggle = (id) => setData({ ...data, tasks: data.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) });
  const remove = (id) => setData({ ...data, tasks: data.tasks.filter(t => t.id !== id) });

  const today = new Date().toISOString().split("T")[0];
  let filtered = data.tasks;
  if (filter === "today") filtered = filtered.filter(t => t.date === today);
  if (filter === "pending") filtered = filtered.filter(t => !t.done);
  if (filter === "done") filtered = filtered.filter(t => t.done);

  const sorted = [...filtered].sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 };
    return p[a.priority] - p[b.priority];
  });

  const todayDone = data.tasks.filter(t => t.date === today && t.done).length;
  const todayTotal = data.tasks.filter(t => t.date === today).length;
  const pct = todayTotal ? Math.round((todayDone / todayTotal) * 100) : 0;

  return (
    <div>
      {/* View switcher */}
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        {[["week","◫  Planning semaine"], ["list","≡  Liste des tâches"]].map(([v,l]) => (
          <button key={v} onClick={() => setView(v)} style={{
            padding:"8px 18px", borderRadius:10, border:`1px solid ${view===v ? "#4ade80" : "#2d3a2d"}`,
            background: view===v ? "#4ade8015" : "transparent", color: view===v ? "#4ade80" : "#6b7c6b",
            cursor:"pointer", fontSize:13, fontWeight: view===v ? 700 : 400,
          }}>{l}</button>
        ))}
      </div>

      {view === "week" && <WeekPlanner data={data} setData={setData} />}

      {view === "list" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h3 style={{ color: "#e8f5e8", margin: 0, fontSize: 18, fontWeight: 800 }}>Liste des tâches ponctuelles</h3>
              <div style={{ color: "#4a5a4a", fontSize: 13, marginTop: 4 }}>{todayDone}/{todayTotal} complétées aujourd'hui · {pct}%</div>
            </div>
            <button onClick={() => setShowAdd(!showAdd)} style={{ background: "#4ade8015", border: "1px solid #4ade80", color: "#4ade80", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
              {showAdd ? "✕" : "+ Tâche"}
            </button>
          </div>

          {todayTotal > 0 && (
            <div style={{ background: "#141914", border: "1px solid #2d3a2d", borderRadius: 12, padding: "10px 16px", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#6b7c6b" }}>Progression du jour</span>
                <span style={{ fontSize: 12, color: "#4ade80", fontFamily: "monospace" }}>{pct}%</span>
              </div>
              <div style={{ background: "#1e281e", borderRadius: 100, height: 5, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #4ade80, #86efac)", borderRadius: 100, transition: "width 0.5s ease" }} />
              </div>
            </div>
          )}

          {showAdd && (
            <div style={{ background: "#141914", border: "1px solid #4ade8040", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <input placeholder="Description de la tâche..." value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
                style={{ width: "100%", background: "#0f130f", border: "1px solid #2d3a2d", color: "#c8d8c8", padding: "9px 12px", borderRadius: 8, fontSize: 14, marginBottom: 10, boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                  style={{ flex: 1, background: "#0f130f", border: "1px solid #2d3a2d", color: "#c8d8c8", padding: "8px 12px", borderRadius: 8, fontSize: 13 }}>
                  <option value="high">🔴 Urgent</option>
                  <option value="medium">🟡 Normal</option>
                  <option value="low">🟢 Faible</option>
                </select>
                <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                  style={{ flex: 1, background: "#0f130f", border: "1px solid #2d3a2d", color: "#c8d8c8", padding: "8px 12px", borderRadius: 8, fontSize: 13 }} />
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  style={{ flex: 1, background: "#0f130f", border: "1px solid #2d3a2d", color: "#c8d8c8", padding: "8px 12px", borderRadius: 8, fontSize: 13 }} />
                <button onClick={add} style={{ background: "#4ade80", color: "#0a0f0a", padding: "8px 20px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Ajouter</button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[["all", "Tout"], ["today", "Aujourd'hui"], ["pending", "En cours"], ["done", "Terminé"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${filter === v ? "#4ade80" : "#2d3a2d"}`, background: filter === v ? "#4ade8015" : "transparent", color: filter === v ? "#4ade80" : "#6b7c6b", cursor: "pointer", fontSize: 12 }}>{l}</button>
            ))}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {sorted.map(task => (
              <div key={task.id} style={{ background: task.done ? "#141914" : "#1a1f1a", border: `1px solid ${task.done ? "#2d3a2d" : priorityColors[task.priority] + "30"}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={() => toggle(task.id)} style={{ width: 24, height: 24, borderRadius: 7, border: `2px solid ${task.done ? "#4ade80" : priorityColors[task.priority]}`, background: task.done ? "#4ade80" : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#0a0f0a" }}>
                  {task.done ? "✓" : ""}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ color: task.done ? "#4a5a4a" : "#c8d8c8", fontWeight: 600, textDecoration: task.done ? "line-through" : "none" }}>{task.text}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: priorityColors[task.priority], background: priorityColors[task.priority] + "15", padding: "1px 7px", borderRadius: 20 }}>{priorityLabels[task.priority]}</span>
                    <span style={{ fontSize: 11, color: "#4a5a4a" }}>⏰ {task.time}</span>
                    <span style={{ fontSize: 11, color: "#4a5a4a" }}>📅 {task.date}</span>
                  </div>
                </div>
                <button onClick={() => remove(task.id)} style={{ background: "none", border: "none", color: "#4a5a4a", cursor: "pointer", fontSize: 14 }}>✕</button>
              </div>
            ))}
            {sorted.length === 0 && (
              <div style={{ textAlign: "center", color: "#4a5a4a", padding: 40, fontSize: 14 }}>Aucune tâche dans cette catégorie</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SportTab({ data, setData }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", duration: 30, calories: 200, sets: "", reps: "", type: "cardio", date: new Date().toISOString().split("T")[0] });

  const add = () => {
    if (!form.name.trim()) return;
    setData({ ...data, sport: [...data.sport, { id: Date.now(), ...form, duration: Number(form.duration), calories: Number(form.calories), sets: form.sets ? Number(form.sets) : null, reps: form.reps ? Number(form.reps) : null }] });
    setForm({ name: "", duration: 30, calories: 200, sets: "", reps: "", type: "cardio", date: new Date().toISOString().split("T")[0] });
    setShowAdd(false);
  };

  const remove = (id) => setData({ ...data, sport: data.sport.filter(s => s.id !== id) });

  const today = new Date().toISOString().split("T")[0];
  const todaySport = data.sport.filter(s => s.date === today);
  const totalCals = todaySport.reduce((a, s) => a + (s.calories || 0), 0);
  const totalTime = todaySport.reduce((a, s) => a + (s.duration || 0), 0);

  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const sessions = data.sport.filter(s => s.date === dateStr);
    return {
      day: d.toLocaleDateString("fr-FR", { weekday: "short" }),
      calories: sessions.reduce((a, s) => a + (s.calories || 0), 0),
      sessions: sessions.length,
    };
  });

  const typeIcon = { cardio: "🏃", muscu: "💪", sport: "⚽", yoga: "🧘", autre: "🏅" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h3 style={{ color: "#e8f5e8", margin: 0, fontSize: 20, fontWeight: 800 }}>Suivi Sportif</h3>
          <div style={{ color: "#4a5a4a", fontSize: 13, marginTop: 4 }}>Aujourd'hui : {totalCals} kcal · {totalTime} min</div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ background: "#4ade8015", border: "1px solid #4ade80", color: "#4ade80", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
          {showAdd ? "✕" : "+ Session"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        <StatCard label="Calories Aujourd'hui" value={totalCals} sub="kcal brûlées" accent="#4ade80" />
        <StatCard label="Temps Actif" value={`${totalTime}'`} sub="minutes d'effort" accent="#86efac" />
        <StatCard label="Sessions" value={todaySport.length} sub="entraînements" accent="#a3e635" />
      </div>

      <div style={{ background: "#141914", border: "1px solid #2d3a2d", borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Calories cette semaine</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weekData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e281e" />
            <XAxis dataKey="day" tick={{ fill: "#6b7c6b", fontSize: 11 }} />
            <YAxis tick={{ fill: "#6b7c6b", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "#141914", border: "1px solid #4ade80", color: "#c8d8c8", borderRadius: 8 }} />
            <Bar dataKey="calories" fill="#4ade80" radius={[6, 6, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {showAdd && (
        <div style={{ background: "#141914", border: "1px solid #4ade8040", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <input placeholder="Exercice (ex: Course à pied)" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              style={{ gridColumn: "1/-1", background: "#0f130f", border: "1px solid #2d3a2d", color: "#c8d8c8", padding: "9px 12px", borderRadius: 8, fontSize: 13 }} />
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              style={{ background: "#0f130f", border: "1px solid #2d3a2d", color: "#c8d8c8", padding: "8px 12px", borderRadius: 8, fontSize: 13 }}>
              <option value="cardio">🏃 Cardio</option>
              <option value="muscu">💪 Musculation</option>
              <option value="sport">⚽ Sport collectif</option>
              <option value="yoga">🧘 Yoga/Stretching</option>
              <option value="autre">🏅 Autre</option>
            </select>
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              style={{ background: "#0f130f", border: "1px solid #2d3a2d", color: "#c8d8c8", padding: "8px 12px", borderRadius: 8, fontSize: 13 }} />
            <input type="number" placeholder="Durée (min)" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
              style={{ background: "#0f130f", border: "1px solid #2d3a2d", color: "#c8d8c8", padding: "8px 12px", borderRadius: 8, fontSize: 13 }} />
            <input type="number" placeholder="Calories brûlées" value={form.calories} onChange={e => setForm(p => ({ ...p, calories: e.target.value }))}
              style={{ background: "#0f130f", border: "1px solid #2d3a2d", color: "#c8d8c8", padding: "8px 12px", borderRadius: 8, fontSize: 13 }} />
            {form.type === "muscu" && <>
              <input type="number" placeholder="Séries" value={form.sets} onChange={e => setForm(p => ({ ...p, sets: e.target.value }))}
                style={{ background: "#0f130f", border: "1px solid #2d3a2d", color: "#c8d8c8", padding: "8px 12px", borderRadius: 8, fontSize: 13 }} />
              <input type="number" placeholder="Répétitions" value={form.reps} onChange={e => setForm(p => ({ ...p, reps: e.target.value }))}
                style={{ background: "#0f130f", border: "1px solid #2d3a2d", color: "#c8d8c8", padding: "8px 12px", borderRadius: 8, fontSize: 13 }} />
            </>}
          </div>
          <button onClick={add} style={{ width: "100%", background: "#4ade80", color: "#0a0f0a", padding: "10px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>Enregistrer la session</button>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {[...data.sport].reverse().map(s => (
          <div key={s.id} style={{ background: "#141914", border: "1px solid #2d3a2d", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 24 }}>{typeIcon[s.type] || "🏅"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#c8d8c8", fontWeight: 600 }}>{s.name}</div>
              <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "#4ade80" }}>⏱ {s.duration} min</span>
                <span style={{ fontSize: 12, color: "#86efac" }}>🔥 {s.calories} kcal</span>
                {s.sets && <span style={{ fontSize: 12, color: "#6ee7b7" }}>× {s.sets} séries · {s.reps} reps</span>}
                <span style={{ fontSize: 12, color: "#4a5a4a" }}>📅 {s.date}</span>
              </div>
            </div>
            <button onClick={() => remove(s.id)} style={{ background: "none", border: "none", color: "#4a5a4a", cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState(loadData);

  const updateData = (newData) => { setData(newData); saveData(newData); };

  const tabComponents = {
    dashboard: <Dashboard data={data} />,
    courses: <CoursesTab data={data} setData={updateData} />,
    revisions: <RevisionsTab data={data} setData={updateData} />,
    tasks: <TasksTab data={data} setData={updateData} />,
    sport: <SportTab data={data} setData={updateData} />,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f0a", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#c8d8c8" }}>
      <style>{`
        * { box-sizing: border-box; }
        input, select, button { font-family: inherit; outline: none; }
        input:focus, select:focus { border-color: #4ade80 !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0f0a; }
        ::-webkit-scrollbar-thumb { background: #2d3a2d; border-radius: 3px; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.5) sepia(1) saturate(5) hue-rotate(80deg); }
        input[type=time]::-webkit-calendar-picker-indicator { filter: invert(0.5) sepia(1) saturate(5) hue-rotate(80deg); }
      `}</style>

      {/* Header */}
      <div style={{ background: "#0d120d", borderBottom: "1px solid #1e281e", padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", gap: 0, overflowX: "auto" }}>
          <div style={{ paddingRight: 24, borderRight: "1px solid #1e281e", marginRight: 8, flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#4ade80", fontFamily: "'Courier New', monospace", letterSpacing: -1 }}>◈ ÉTUDIANT</div>
            <div style={{ fontSize: 9, color: "#2d3a2d", letterSpacing: 3, textTransform: "uppercase" }}>Life Manager</div>
          </div>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: "none", border: "none", padding: "16px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600,
              color: tab === t.id ? "#4ade80" : "#4a5a4a",
              borderBottom: `2px solid ${tab === t.id ? "#4ade80" : "transparent"}`,
              whiteSpace: "nowrap", letterSpacing: 0.5, transition: "all 0.2s",
            }}>
              <span style={{ marginRight: 6 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px 60px" }}>
        {tabComponents[tab]}
      </div>
    </div>
  );
}
