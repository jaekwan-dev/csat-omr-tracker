"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  isPublished: boolean;
  stats: { avg: number; max: number; min: number; submissionCount: number };
}

export default function ExamManagementPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("KOREAN");
  const [searchQuery, setSearchQuery] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);
          
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
    if (!confirm(`"${exam.title}" 시험을 삭제하시겠습니까?\n제출된 ${exam.stats.submissionCount}개의 답안도 함께 삭제됩니다.`)) return;
    setDeletingId(exam.id);
    const r = await fetch(`/api/teacher/exams/${exam.id}`, { method: "DELETE" });
    if (r.ok) await fetchExams();
    setDeletingId(null);
  }

  async function togglePublish(exam: Exam) {
    const r = await fetch(`/api/teacher/exams/${exam.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !exam.isPublished })
    });
    if (r.ok) {
      setExams((prev) => prev.map(e => e.id === exam.id ? { ...e, isPublished: !e.isPublished } : e));
    }
  }

  

  

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-12">
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

                {/* Exam Title & Stats */}
                <div className="flex-1 min-w-[200px] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", exam.isPublished ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500")}>
                      {exam.isPublished ? "출시됨" : "미출시"}
                    </span>
                    <div className="text-base font-bold text-foreground tracking-tight">{exam.title}</div>
                  </div>
                  
                  {exam.stats.submissionCount > 0 ? (
                    <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                      <span className="bg-secondary px-2 py-1 rounded-md text-foreground">응시: {exam.stats.submissionCount}명</span>
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md">평균: {exam.stats.avg}점</span>
                      <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md">최고: {exam.stats.max}점</span>
                      <span className="bg-red-50 text-red-700 px-2 py-1 rounded-md">최저: {exam.stats.min}점</span>
                    </div>
                  ) : (
                    <div className="text-[11px] font-bold text-muted-foreground bg-secondary/50 inline-block px-2 py-1 rounded-md">
                      아직 응시한 학생이 없습니다.
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 w-full mt-1 sm:w-auto sm:mt-0 flex-wrap">
                  <button
                    onClick={() => togglePublish(exam)}
                    className={cn(
                      "flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors",
                      exam.isPublished
                        ? "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200"
                        : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    )}
                  >
                    {exam.isPublished ? "숨기기" : "출시하기"}
                  </button>
                  <button
                    onClick={() => router.push(`/teacher/exams/${exam.id}`)}
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

    </div>
  );
}
