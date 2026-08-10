"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
  grade: number;
  classNum: number;
  pinCode: string;
  _count: { submissions: number };
}

export default function StudentManagementPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD");

  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formPin, setFormPin] = useState("");
  const [formGrade, setFormGrade] = useState("");
  const [formClass, setFormClass] = useState("");

  // CSV Upload State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvError, setCsvError] = useState("");
  const [csvUploading, setCsvUploading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPinIdMap, setShowPinIdMap] = useState<Record<string, boolean>>({});

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teacher/students");
      const data = await res.json();
      if (res.ok) setStudents(data.students || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filteredStudents = students.filter(
    (s) =>
      s.name.includes(searchQuery) ||
      s.id.includes(searchQuery) ||
      `${s.grade}학년`.includes(searchQuery) ||
      `${s.classNum}반`.includes(searchQuery)
  );

  function openAddModal() {
    setModalMode("ADD");
    setFormId("");
    setFormName("");
    setFormGrade("1");
    setFormClass("1");
    setFormPin("0000");
    setErrorMsg("");
    setIsModalOpen(true);
  }

  function openEditModal(student: Student) {
    setModalMode("EDIT");
    setFormId(student.id);
    setFormName(student.name);
    setFormPin(student.pinCode);
    setFormGrade(String(student.grade));
    setFormClass(String(student.classNum));
    setErrorMsg("");
    setIsModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formId || !formName || !formGrade || !formClass || !formPin) {
      setErrorMsg("모든 필드를 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const url = modalMode === "ADD" ? "/api/teacher/students" : `/api/teacher/students/${formId}`;
      const method = modalMode === "ADD" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: formId,
          name: formName,
          pinCode: formPin,
          grade: Number(formGrade),
          classNum: Number(formClass),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "저장 중 오류가 발생했습니다.");
      } else {
        setIsModalOpen(false);
        await fetchStudents();
      }
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(student: Student) {
    if (
      !confirm(
        `정말 삭제하시겠습니까?\n[학번 ${student.id} / ${student.name}]\n제출 이력(${student._count.submissions}건)도 함께 삭제됩니다.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/teacher/students/${student.id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchStudents();
      } else {
        alert("삭제 중 오류가 발생했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    }
  }

  async function handleCsvUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!csvFile) {
      setCsvError("CSV 파일을 선택해주세요.");
      return;
    }

    setCsvUploading(true);
    setCsvError("");

    try {
      const formData = new FormData();
      formData.append("file", csvFile);

      const res = await fetch("/api/teacher/students/bulk", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setCsvError(data.error || "업로드에 실패했습니다.");
      } else {
        alert(`${data.count}명의 학생이 성공적으로 등록되었습니다.`);
        setIsCsvModalOpen(false);
        setCsvFile(null);
        await fetchStudents();
      }
    } catch {
      setCsvError("네트워크 오류가 발생했습니다.");
    } finally {
      setCsvUploading(false);
    }
  }

  function downloadCsvTemplate() {
    const csvContent = "학번,이름,학년,반\n1101,홍길동,1,1\n1102,김철수,1,1\n";
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "학생일괄등록양식.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const toggleShowPin = (id: string) => {
    setShowPinIdMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 pb-12">
      {/* Mobile-Friendly Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">학생 관리</h1>
            <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-1 rounded-full">
              {students.length}명
            </span>
          </div>
          <p className="text-sm text-muted-foreground">학생 정보와 비밀번호(PIN)를 관리하세요.</p>
        </div>

        {/* Top Action Buttons (Responsive Grid) */}
        <div className="grid grid-cols-2 md:flex gap-2.5 w-full md:w-auto">
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-all"
          >
            <span>➕</span>
            <span>새 학생 등록</span>
          </button>
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm font-bold shadow-sm hover:bg-accent transition-all"
          >
            <span>📄</span>
            <span>CSV 일괄 등록</span>
          </button>
        </div>
      </div>

      {/* Mobile-Friendly Search Bar */}
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-2.5 bg-background rounded-2xl px-4 py-3 border border-border shadow-sm">
          <span className="text-lg text-muted-foreground">🔍</span>
          <input
            type="text"
            placeholder="이름, 학번, 학년, 반으로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-none bg-transparent outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full hover:text-foreground transition-colors"
              aria-label="검색어 초기화"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="text-xs text-muted-foreground px-1">
            검색 결과 <strong className="text-foreground">{filteredStudents.length}</strong>명
          </div>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="spinner mx-auto mb-3" />
          <div className="text-sm text-muted-foreground">학생 목록을 불러오는 중...</div>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-card rounded-3xl p-12 text-center border border-border shadow-sm flex flex-col items-center gap-2">
          <div className="text-4xl mb-2">👤</div>
          <div className="text-base font-bold text-foreground">등록된 학생이 없습니다</div>
          <div className="text-sm text-muted-foreground mt-1">
            {searchQuery ? "검색 조건에 해당되는 학생이 없습니다." : "새 학생 등록 버튼을 눌러 추가하세요."}
          </div>
        </div>
      ) : (
        <>
          {/* MOBILE VIEW (< 768px): Card Grid Layout */}
          <div className="md:hidden flex flex-col gap-3">
            {filteredStudents.map((student) => {
              const isPinVisible = !!showPinIdMap[student.id];
              return (
                <div key={student.id} className="bg-card rounded-2xl p-4 border border-border shadow-sm flex flex-col gap-3">
                  {/* Card Header Row */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground text-lg font-black flex items-center justify-center shrink-0 shadow-sm">
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-foreground">{student.name}</span>
                        <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-bold px-1.5 py-0.5 rounded-md">
                          {student.grade}학년 {student.classNum}반
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground font-semibold mt-0.5">
                        학번: {student.id}
                      </div>
                    </div>
                    {/* Submission Count Chip */}
                    <div className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-1 rounded-full shrink-0">
                      제출 {student._count.submissions}건
                    </div>
                  </div>

                  {/* Card Content Row (PIN & Info) */}
                  <div className="flex items-center justify-between bg-secondary/50 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-bold">PIN</span>
                      <span className="font-mono text-sm font-black text-primary tracking-widest">
                        {isPinVisible ? student.pinCode : "••••"}
                      </span>
                      <button
                        onClick={() => toggleShowPin(student.id)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors p-1"
                        title={isPinVisible ? "숨기기" : "보기"}
                      >
                        {isPinVisible ? "👁️‍🗨️" : "👁️"}
                      </button>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="flex gap-2 w-full mt-1">
                    <button
                      onClick={() => openEditModal(student)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-sm font-bold text-foreground border border-border hover:bg-accent transition-colors"
                    >
                      ✏️ 수정
                    </button>
                    <button
                      onClick={() => handleDelete(student)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-red-50 text-sm font-bold text-red-600 border border-red-100 hover:bg-red-100 transition-colors"
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP VIEW (>= 768px): Table Layout */}
          <div className="hidden md:block bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-secondary border-b border-border">
                  <th className="px-4 py-3.5 text-xs font-bold text-muted-foreground text-left">학번</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-muted-foreground text-left">이름</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-muted-foreground text-left">학년 / 반</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-muted-foreground text-left">PIN 번호</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-muted-foreground text-left">제출 기록</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-muted-foreground text-right">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5 text-sm font-bold text-primary">{s.id}</td>
                    <td className="px-4 py-3.5 text-sm font-bold text-foreground">{s.name}</td>
                    <td className="px-4 py-3.5">
                      <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-bold px-2 py-1 rounded-md">
                        {s.grade}학년 {s.classNum}반
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-sm tracking-widest bg-secondary text-foreground px-2.5 py-1 rounded-lg font-bold border border-border">
                        {s.pinCode}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("text-sm font-bold", s._count.submissions > 0 ? "text-primary" : "text-muted-foreground")}>
                        {s._count.submissions}회 제출
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => openEditModal(s)}
                          className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-bold text-foreground border border-border hover:bg-accent transition-colors"
                        >
                          ✏️ 수정
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          className="px-3 py-1.5 rounded-lg bg-red-50 text-xs font-bold text-red-600 border border-red-100 hover:bg-red-100 transition-colors"
                        >
                          🗑️ 삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Responsive Modal (Student Add/Edit) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-zinc-950 rounded-3xl p-6 sm:p-7 w-full max-w-sm shadow-xl border border-border animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {modalMode === "ADD" ? "➕ 새 학생 추가" : "✏️ 학생 정보 수정"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-lg px-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 ml-1">학번 (4자리)</label>
                <input
                  type="text"
                  placeholder="예: 1101"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value.replace(/\D/g, ""))}
                  disabled={modalMode === "EDIT"}
                  maxLength={4}
                  autoFocus
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 disabled:opacity-50 transition-all shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 ml-1">이름</label>
                  <input
                    type="text"
                    placeholder="홍길동"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all shadow-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 ml-1">PIN (4자리)</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="1234"
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 font-mono tracking-widest transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 ml-1">학년</label>
                  <input
                    type="number"
                    min={1}
                    max={3}
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all shadow-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 ml-1">반</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                  <span>⚠️</span> {errorMsg}
                </div>
              )}

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary text-sm font-bold text-foreground border border-border hover:bg-accent transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[2] px-4 py-3 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
                >
                  {submitting ? "저장 중..." : "💾 저장하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Bulk Upload Modal */}
      {isCsvModalOpen && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsCsvModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-zinc-950 rounded-3xl p-6 sm:p-7 w-full max-w-sm shadow-xl border border-border animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">📄 CSV 대량 등록</h2>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-lg px-2"
              >
                ✕
              </button>
            </div>

            <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed font-medium">
              엑셀/CSV 양식을 업로드하여 수십 명의 학생을 한 번에 등록합니다.
              <br />최초 PIN 번호는 자동으로 <strong className="text-zinc-900 dark:text-white">0000</strong>으로 설정됩니다.
            </p>

            <form onSubmit={handleCsvUpload} className="flex flex-col gap-4">
              <div className="p-5 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-zinc-900 dark:text-zinc-100 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-zinc-200 dark:file:bg-zinc-800 file:text-zinc-900 dark:file:text-zinc-100 file:font-bold cursor-pointer"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={downloadCsvTemplate}
                  className="text-[13px] font-bold text-primary hover:underline"
                >
                  ⬇️ 표준 CSV 양식 다운로드
                </button>
              </div>

              {csvError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                  <span>⚠️</span> {csvError}
                </div>
              )}

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary text-sm font-bold text-foreground border border-border hover:bg-accent transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={csvUploading || !csvFile}
                  className="flex-[2] px-4 py-3 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
                >
                  {csvUploading ? "업로드 중..." : "🚀 일괄 업로드"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
