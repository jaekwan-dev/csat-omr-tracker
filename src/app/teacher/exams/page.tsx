"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SUBJECT_LABEL: Record<string, string> = { KOREAN: "국어", MATH: "수학", ENGLISH: "영어" };
const SUBJECT_EMOJI: Record<string, string> = { KOREAN: "📚", MATH: "✏️", ENGLISH: "💡" };

const SUBJECT_COLOR_HEX: Record<string, string> = {
  KOREAN: "#7c3aed",
  MATH: "#f97316",
  ENGLISH: "#3b82f6",
};

interface Question { questionNum: number; correctAnswer: number; score: number; isSubjective: boolean; }
interface Exam {
  id: number; subject: string; title: string;
  totalQuestions: number; startNum: number;
  explanationPdfUrl?: string | null;
  questions: Question[];
  _count: { submissions: number };
}

export default function ExamManagementPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("KOREAN");
  const [searchQuery, setSearchQuery] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editQuestions, setEditQuestions] = useState<Question[]>([]);
  const [editExplanationFile, setEditExplanationFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/teacher/exams");
      const text = await r.text();
      let d;
      try {
        d = JSON.parse(text);
      } catch (err) {
        setExams([]);
        return;
      }
      if (r.ok) {
        setExams(d.exams ?? []);
      } else {
        setExams([]);
      }
    } catch (e) {
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      const matchSubject = e.subject === selectedSubjectFilter;
      const matchSearch = e.title.includes(searchQuery) || SUBJECT_LABEL[e.subject]?.includes(searchQuery);
      return matchSubject && matchSearch;
    });
  }, [exams, selectedSubjectFilter, searchQuery]);

  async function handleDelete(exam: Exam) {
    if (!confirm(`"${exam.title}" 시험을 삭제하시겠습니까?\n제출된 ${exam._count.submissions}개의 답안도 함께 삭제됩니다.`)) return;
    setDeletingId(exam.id);
    const r = await fetch(`/api/teacher/exams/${exam.id}`, { method: "DELETE" });
    if (r.ok) await fetchExams();
    setDeletingId(null);
  }

  function startEdit(exam: Exam) {
    setEditingExam(exam);
    setEditQuestions(exam.questions.map((q) => ({ ...q })));
    setEditExplanationFile(null);
    setMsg("");
  }

  async function handleSaveEdit() {
    if (!editingExam) return;
    setSaving(true);
    let explanationPdfUrl = editingExam.explanationPdfUrl;

    if (editExplanationFile) {
      try {
        const formData = new FormData();
        formData.append("file", editExplanationFile);
        const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(editExplanationFile.name)}`, {
          method: "POST",
          body: editExplanationFile,
        });
        if (!uploadRes.ok) throw new Error("업로드 실패");
        const uploadData = await uploadRes.json();
        explanationPdfUrl = uploadData.url;
      } catch (err: any) {
        setMsg("❌ " + (err.message || "해설지 업로드 실패"));
        setSaving(false);
        return;
      }
    }

    const r = await fetch(`/api/teacher/exams/${editingExam.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editingExam.title, explanationPdfUrl, questions: editQuestions }),
    });
    setSaving(false);
    if (r.ok) {
      setMsg("✅ 저장되었습니다.");
      await fetchExams();
      setTimeout(() => { setEditingExam(null); setMsg(""); }, 1000);
    } else {
      setMsg("❌ 저장 실패");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-24">
      {/* Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">시험 관리</h1>
          <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-1 rounded-full">
            {exams.length}개 시험
          </span>
        </div>
        <Link
          href="/teacher/exams/new"
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
        >
          <span>➕</span>
          <span>새 시험 등록</span>
        </Link>
      </div>

      {/* Filter Card */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-4 mb-6 space-y-4">
        {/* Subject Filter Grid */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "KOREAN", label: "국어", emoji: "📚", count: exams.filter(e => e.subject === "KOREAN").length },
            { id: "MATH", label: "수학", emoji: "✏️", count: exams.filter(e => e.subject === "MATH").length },
            { id: "ENGLISH", label: "영어", emoji: "💡", count: exams.filter(e => e.subject === "ENGLISH").length },
          ].map((tab) => {
            const isActive = selectedSubjectFilter === tab.id;
            const activeColor = SUBJECT_COLOR_HEX[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedSubjectFilter(tab.id)}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl transition-all border",
                  isActive
                    ? "text-white shadow-sm border-transparent"
                    : "bg-secondary text-secondary-foreground border-border hover:bg-accent"
                )}
                style={isActive ? { background: activeColor } : undefined}
              >
                <span className="text-base">{tab.emoji}</span>
                <span className="text-sm font-semibold">{tab.label}</span>
                <span className="text-[11px] opacity-80 font-medium">({tab.count})</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3.5 py-2 border border-border">
          <span className="text-base text-muted-foreground">🔍</span>
          <input
            type="text"
            placeholder={`${SUBJECT_LABEL[selectedSubjectFilter]} 시험 제목 검색...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-16">
          <div className="spinner mx-auto mb-3" />
          <div className="text-sm text-muted-foreground">시험 목록을 불러오는 중...</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredExams.length === 0 && (
        <div className="bg-card rounded-2xl p-12 text-center border border-border flex flex-col items-center gap-2 shadow-sm">
          <div className="text-4xl mb-2">📝</div>
          <div className="text-base font-bold text-foreground">등록된 시험이 없습니다</div>
          <div className="text-sm text-muted-foreground">
            {searchQuery ? "검색 조건에 일치하는 시험이 없습니다." : "상단의 '새 시험 등록' 버튼을 눌러 시험을 추가하세요."}
          </div>
        </div>
      )}

      {/* Exam List */}
      {!loading && filteredExams.length > 0 && (
        <div className="flex flex-col gap-3">
          {filteredExams.map((exam) => {
            const colorHex = SUBJECT_COLOR_HEX[exam.subject];
            const emoji = SUBJECT_EMOJI[exam.subject];

            return (
              <div key={exam.id} className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-sm flex flex-wrap items-center gap-4 transition-all hover:shadow-md">
                {/* Subject Tag */}
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold shrink-0"
                  style={{ background: `${colorHex}15`, color: colorHex }}
                >
                  <span>{emoji}</span>
                  <span>{SUBJECT_LABEL[exam.subject]}</span>
                </div>

                {/* Exam Title */}
                <div className="flex-1 min-w-[200px]">
                  <div className="text-base font-bold text-foreground tracking-tight">{exam.title}</div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 w-full mt-1 sm:w-auto sm:mt-0">
                  <button
                    onClick={() => startEdit(exam)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-secondary text-sm font-bold text-foreground border border-border hover:bg-accent transition-colors"
                  >
                    ✏️ 수정
                  </button>
                  <button
                    onClick={() => handleDelete(exam)}
                    disabled={deletingId === exam.id}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-red-50 text-sm font-bold text-red-600 border border-red-100 hover:bg-red-100 disabled:opacity-50 transition-colors flex justify-center items-center"
                  >
                    {deletingId === exam.id ? <span className="spinner !w-4 !h-4 !border-t-red-600 !border-red-200" /> : "🗑️ 삭제"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingExam && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setEditingExam(null); }}>
          <div className="bg-card rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-xl border border-border animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">{editingExam.title} — 정답 및 배점 수정</h2>
                <div className="text-xs font-medium text-muted-foreground mt-1">
                  {SUBJECT_LABEL[editingExam.subject]} · 총 {editingExam.totalQuestions}문항
                </div>
              </div>
              <button onClick={() => setEditingExam(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="mb-4">
              <label className="text-sm font-bold text-foreground block mb-2">
                해설지 PDF 업로드 (새 파일 선택 시 교체됨)
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setEditExplanationFile(e.target.files?.[0] || null)}
                className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-secondary file:text-secondary-foreground file:font-medium border border-border rounded-xl p-2 cursor-pointer"
              />
              {editingExam.explanationPdfUrl && !editExplanationFile && (
                <div className="text-xs font-medium text-teal-600 mt-1.5">
                  현재 등록된 해설지가 있습니다.
                </div>
              )}
            </div>

            <div className="overflow-y-auto max-h-[60vh] mb-5 rounded-2xl border border-border">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-secondary z-10">
                  <tr>
                    <th className="px-3 py-2.5 text-xs font-bold text-muted-foreground text-left w-12">번호</th>
                    <th className="px-3 py-2.5 text-xs font-bold text-muted-foreground text-center">정답 입력</th>
                    <th className="px-3 py-2.5 text-xs font-bold text-muted-foreground text-center w-20">배점</th>
                  </tr>
                </thead>
                <tbody>
                  {editQuestions.map((q, i) => (
                    <tr key={q.questionNum} className="border-b border-border last:border-0 bg-card">
                      <td className="px-3 py-2.5 text-center">
                        <span className="font-bold text-foreground text-sm">{q.questionNum}</span>
                      </td>
                      <td className="px-3 py-2.5 flex justify-center">
                        {q.isSubjective ? (
                          <input
                            type="number" min={0} max={999}
                            value={q.correctAnswer}
                            onChange={(e) => {
                              const nxt = [...editQuestions];
                              nxt[i] = { ...nxt[i], correctAnswer: Number(e.target.value) };
                              setEditQuestions(nxt);
                            }}
                            className="w-16 px-2 py-1.5 rounded-lg border border-input bg-background text-center text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
                            placeholder="정답"
                          />
                        ) : (
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((c) => (
                              <button
                                key={c}
                                onClick={() => {
                                  const nxt = [...editQuestions];
                                  nxt[i] = { ...nxt[i], correctAnswer: c };
                                  setEditQuestions(nxt);
                                }}
                                className={cn(
                                  "w-8 h-8 rounded-full text-xs font-bold transition-all",
                                  q.correctAnswer === c
                                    ? "text-white shadow-sm"
                                    : "bg-background border border-input text-muted-foreground hover:border-foreground/30"
                                )}
                                style={q.correctAnswer === c ? { background: SUBJECT_COLOR_HEX[editingExam.subject] } : undefined}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="number" min={1} max={10}
                          value={q.score}
                          onChange={(e) => {
                            const nxt = [...editQuestions];
                            nxt[i] = { ...nxt[i], score: Number(e.target.value) };
                            setEditQuestions(nxt);
                          }}
                          className="w-14 px-2 py-1.5 rounded-lg border border-input bg-background text-center text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {msg && (
              <div className={cn(
                "mb-4 text-sm font-semibold rounded-xl px-4 py-3 border",
                msg.startsWith("✅") ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-red-50 text-red-600 border-red-200"
              )}>
                {msg}
              </div>
            )}
            <div className="flex gap-2.5">
              <button onClick={() => setEditingExam(null)} className="flex-1 px-4 py-3 rounded-xl bg-secondary text-sm font-bold text-foreground border border-border hover:bg-accent transition-colors">
                취소
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-[2] px-4 py-3 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
                style={{ background: SUBJECT_COLOR_HEX[editingExam.subject] }}
              >
                {saving ? <span className="flex justify-center items-center gap-2"><span className="spinner !w-4 !h-4" />저장 중...</span> : "💾 저장하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
