"use client";

import { useState, useEffect, useCallback } from "react";

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
    <div className="container" style={{ paddingTop: 24, paddingBottom: 80 }}>
      {/* Mobile-Friendly Header */}
      <div style={styles.headerBlock}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h1 style={styles.title}>학생 관리</h1>
            <span style={styles.countBadge}>{students.length}명</span>
          </div>
        </div>

        {/* Top Action Buttons (Responsive Grid) */}
        <div style={styles.actionGroup}>
          <button onClick={openAddModal} className="btn btn-primary" style={styles.addBtn}>
            <span>➕</span>
            <span>새 학생 등록</span>
          </button>
          <button onClick={() => setIsCsvModalOpen(true)} className="btn btn-ghost" style={styles.csvBtn}>
            <span>📄</span>
            <span>CSV 일괄 등록</span>
          </button>
        </div>
      </div>

      {/* Mobile-Friendly Search Bar */}
      <div style={styles.searchWrap}>
        <div style={styles.searchBox}>
          <span style={{ fontSize: 18, color: "#64748b" }}>🔍</span>
          <input
            type="text"
            placeholder="이름, 학번, 학년, 반으로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={styles.clearSearchBtn} aria-label="검색어 초기화">
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <div style={styles.searchCountText}>
            검색 결과 <strong>{filteredStudents.length}</strong>명
          </div>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <div className="spinner" style={{ width: 36, height: 36, borderTopColor: "#0f766e", borderColor: "#99f6e4", margin: "0 auto" }} />
          <div style={{ fontSize: 14, color: "#64748b", marginTop: 12 }}>학생 목록을 불러오는 중...</div>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>👤</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>등록된 학생이 없습니다</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            {searchQuery ? "검색 조건에 해당되는 학생이 없습니다." : "새 학생 등록 버튼을 눌러 추가하세요."}
          </div>
        </div>
      ) : (
        <>
          {/* MOBILE VIEW (< 768px): Card Grid Layout */}
          <div className="mobile-student-cards" style={styles.mobileCardGrid}>
            {filteredStudents.map((student) => {
              const isPinVisible = !!showPinIdMap[student.id];
              return (
                <div key={student.id} style={styles.studentCard}>
                  {/* Card Header Row */}
                  <div style={styles.cardHeaderRow}>
                    <div style={styles.cardAvatar}>
                      {student.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={styles.cardStudentName}>{student.name}</span>
                        <span style={styles.classBadge}>
                          {student.grade}학년 {student.classNum}반
                        </span>
                      </div>
                      <div style={styles.cardStudentId}>
                        학번: {student.id}
                      </div>
                    </div>
                    {/* Submission Count Chip */}
                    <div style={styles.submissionChip}>
                      제출 {student._count.submissions}건
                    </div>
                  </div>

                  {/* Card Content Row (PIN & Info) */}
                  <div style={styles.cardBodyRow}>
                    <div style={styles.pinBox}>
                      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>PIN</span>
                      <span style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 800, color: "#0f766e", letterSpacing: 2 }}>
                        {isPinVisible ? student.pinCode : "••••"}
                      </span>
                      <button
                        onClick={() => toggleShowPin(student.id)}
                        style={styles.pinToggleBtn}
                        title={isPinVisible ? "숨기기" : "보기"}
                      >
                        {isPinVisible ? "👁️‍🗨️" : "👁️"}
                      </button>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div style={styles.cardFooter}>
                    <button onClick={() => openEditModal(student)} style={styles.cardEditBtn}>
                      ✏️ 수정
                    </button>
                    <button onClick={() => handleDelete(student)} style={styles.cardDeleteBtn}>
                      🗑️ 삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP VIEW (>= 768px): Table Layout */}
          <div className="desktop-student-table" style={styles.tableCard}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f0fdfa", borderBottom: "1px solid #ccfbf1" }}>
                  <th style={styles.th}>학번</th>
                  <th style={styles.th}>이름</th>
                  <th style={styles.th}>학년 / 반</th>
                  <th style={styles.th}>PIN 번호</th>
                  <th style={styles.th}>제출 기록</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id} style={styles.tableRow}>
                    <td style={{ ...styles.td, fontWeight: 800, color: "#0f766e" }}>{s.id}</td>
                    <td style={{ ...styles.td, fontWeight: 800, color: "#0f172a" }}>{s.name}</td>
                    <td style={styles.td}>
                      <span style={styles.classBadge}>{s.grade}학년 {s.classNum}반</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.desktopPinCode}>{s.pinCode}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontWeight: 700, color: s._count.submissions > 0 ? "#0f766e" : "#94a3b8" }}>
                        {s._count.submissions}회 제출
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 8 }}>
                        <button onClick={() => openEditModal(s)} className="btn btn-ghost btn-sm" style={styles.dtEditBtn}>
                          ✏️ 수정
                        </button>
                        <button onClick={() => handleDelete(s)} className="btn btn-sm" style={styles.dtDeleteBtn}>
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
        <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div style={styles.responsiveModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>
                {modalMode === "ADD" ? "➕ 새 학생 추가" : "✏️ 학생 정보 수정"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={styles.modalCloseBtn}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={styles.fieldBlock}>
                <label className="label">학번 (4자리)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="예: 1101"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value.replace(/\D/g, ""))}
                  disabled={modalMode === "EDIT"}
                  maxLength={4}
                  autoFocus
                />
              </div>

              <div style={styles.formRowGrid}>
                <div style={styles.fieldBlock}>
                  <label className="label">이름</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="홍길동"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div style={styles.fieldBlock}>
                  <label className="label">PIN 번호 (4자리)</label>
                  <input
                    type="text"
                    className="input"
                    maxLength={4}
                    placeholder="1234"
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>

              <div style={styles.formRowGrid}>
                <div style={styles.fieldBlock}>
                  <label className="label">학년</label>
                  <input
                    type="number"
                    min={1}
                    max={3}
                    className="input"
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value)}
                  />
                </div>
                <div style={styles.fieldBlock}>
                  <label className="label">반</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className="input"
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="alert alert-error">
                  <span>⚠️</span> {errorMsg}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost" style={{ flex: 1 }}>
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 2, background: "linear-gradient(135deg, #0f766e, #0891b2)", boxShadow: "0 4px 14px rgba(8,145,178,0.3)" }}
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
        <div style={styles.modalOverlay} onClick={() => setIsCsvModalOpen(false)}>
          <div style={styles.responsiveModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>📄 CSV 대량 등록</h2>
              <button onClick={() => setIsCsvModalOpen(false)} style={styles.modalCloseBtn}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16, lineHeight: 1.5 }}>
              엑셀/CSV 양식을 업로드하여 수십 명의 학생을 한 번에 등록합니다.
              <br />최초 PIN 번호는 자동으로 0000으로 설정됩니다.
            </p>

            <form onSubmit={handleCsvUpload} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={styles.fileDropZone}>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  style={{ width: "100%", fontSize: 14 }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="button" onClick={downloadCsvTemplate} style={styles.templateLinkBtn}>
                  ⬇️ 표준 CSV 양식 다운로드
                </button>
              </div>

              {csvError && (
                <div className="alert alert-error">
                  <span>⚠️</span> {csvError}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button type="button" onClick={() => setIsCsvModalOpen(false)} className="btn btn-ghost" style={{ flex: 1 }}>
                  취소
                </button>
                <button
                  type="submit"
                  disabled={csvUploading || !csvFile}
                  className="btn btn-primary"
                  style={{ flex: 2, background: "linear-gradient(135deg, #0f766e, #0891b2)" }}
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

const styles: Record<string, React.CSSProperties> = {
  headerBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
  },
  countBadge: {
    background: "#ccfbf1",
    color: "#0f766e",
    fontSize: 12,
    fontWeight: 800,
    padding: "3px 10px",
    borderRadius: 999,
  },
  actionGroup: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 10,
    width: "100%",
  },
  addBtn: {
    background: "linear-gradient(135deg, #0f766e, #0891b2)",
    color: "#fff",
    boxShadow: "0 4px 14px rgba(8,145,178,0.3)",
    padding: "12px 16px",
    borderRadius: 14,
    fontSize: 14,
  },
  csvBtn: {
    background: "#fff",
    border: "1px solid #cbd5e1",
    color: "#334155",
    padding: "12px 16px",
    borderRadius: 14,
    fontSize: 14,
  },
  searchWrap: {
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#fff",
    borderRadius: 16,
    padding: "12px 16px",
    border: "1.5px solid #cbd5e1",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  searchInput: {
    flex: 1,
    border: "none",
    background: "transparent",
    fontSize: 15,
    outline: "none",
    color: "#0f172a",
  },
  clearSearchBtn: {
    fontSize: 14,
    color: "#94a3b8",
    padding: "2px 6px",
    borderRadius: 999,
    background: "#f1f5f9",
  },
  searchCountText: {
    fontSize: 12,
    color: "#64748b",
    paddingLeft: 4,
  },
  emptyState: {
    background: "#fff",
    borderRadius: 24,
    padding: "60px 20px",
    textAlign: "center",
    border: "1px solid #e2e8f0",
  },

  /* Mobile Card Layout */
  mobileCardGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  studentCard: {
    background: "#fff",
    borderRadius: 20,
    padding: "16px 18px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  cardHeaderRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "linear-gradient(135deg, #0f766e, #0891b2)",
    color: "#fff",
    fontSize: 18,
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 4px 10px rgba(8,145,178,0.2)",
  },
  cardStudentName: {
    fontSize: 16,
    fontWeight: 900,
    color: "#0f172a",
  },
  classBadge: {
    background: "#ccfbf1",
    color: "#0f766e",
    fontSize: 11,
    fontWeight: 800,
    padding: "3px 8px",
    borderRadius: 6,
  },
  cardStudentId: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 600,
    marginTop: 2,
  },
  submissionChip: {
    marginLeft: "auto",
    fontSize: 11,
    fontWeight: 700,
    color: "#0f766e",
    background: "#f0fdfa",
    border: "1px solid #99f6e4",
    padding: "4px 10px",
    borderRadius: 999,
  },
  cardBodyRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#f8fafc",
    borderRadius: 12,
    padding: "10px 14px",
  },
  pinBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  pinToggleBtn: {
    background: "none",
    border: "none",
    fontSize: 14,
    cursor: "pointer",
    padding: 2,
  },
  cardFooter: {
    display: "flex",
    gap: 8,
  },
  cardEditBtn: {
    flex: 1,
    padding: "10px",
    borderRadius: 12,
    background: "#f1f5f9",
    color: "#334155",
    fontWeight: 700,
    fontSize: 13,
    textAlign: "center",
  },
  cardDeleteBtn: {
    flex: 1,
    padding: "10px",
    borderRadius: 12,
    background: "#fef2f2",
    color: "#dc2626",
    fontWeight: 700,
    fontSize: 13,
    textAlign: "center",
    border: "1px solid #fecaca",
  },

  /* Desktop Table Layout */
  tableCard: {
    background: "#fff",
    borderRadius: 20,
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
    overflow: "hidden",
  },
  th: {
    padding: "14px 18px",
    fontSize: 13,
    fontWeight: 700,
    color: "#0f766e",
    textAlign: "left",
  },
  td: {
    padding: "14px 18px",
    fontSize: 14,
    verticalAlign: "middle",
  },
  tableRow: {
    borderBottom: "1px solid #f1f5f9",
  },
  desktopPinCode: {
    fontFamily: "monospace",
    letterSpacing: 2,
    background: "#f1f5f9",
    padding: "4px 10px",
    borderRadius: 8,
    fontWeight: 800,
    color: "#475569",
    fontSize: 13,
  },
  dtEditBtn: {
    padding: "6px 12px",
    fontSize: 13,
  },
  dtDeleteBtn: {
    padding: "6px 12px",
    fontSize: 13,
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
  },

  /* Modal */
  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    background: "rgba(15,23,42,0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  responsiveModal: {
    background: "#fff",
    borderRadius: 28,
    padding: "28px 24px",
    width: "100%",
    maxWidth: 440,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    animation: "scaleIn 0.2s ease",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalCloseBtn: {
    fontSize: 18,
    color: "#94a3b8",
    padding: "4px 8px",
    borderRadius: 999,
  },
  formRowGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  fieldBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  fileDropZone: {
    padding: 20,
    background: "#f8fafc",
    borderRadius: 16,
    border: "2px dashed #cbd5e1",
  },
  templateLinkBtn: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0f766e",
    textDecoration: "underline",
    background: "none",
    border: "none",
    cursor: "pointer",
  },
};
