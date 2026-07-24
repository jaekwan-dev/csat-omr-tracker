"use client";

import { useState, useEffect, useCallback } from "react";

interface Student {
  id: string;
  name: string;
  grade: number;
  classNum: number;
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
  const [formGrade, setFormGrade] = useState("");
  const [formClass, setFormClass] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const filteredStudents = students.filter(s => 
    s.name.includes(searchQuery) || 
    s.id.includes(searchQuery) || 
    `${s.grade}학년`.includes(searchQuery) ||
    `${s.classNum}반`.includes(searchQuery)
  );

  function openAddModal() {
    setModalMode("ADD");
    setFormId(""); setFormName(""); setFormGrade(""); setFormClass("");
    setErrorMsg("");
    setIsModalOpen(true);
  }

  function openEditModal(student: Student) {
    setModalMode("EDIT");
    setFormId(student.id);
    setFormName(student.name);
    setFormGrade(String(student.grade));
    setFormClass(String(student.classNum));
    setErrorMsg("");
    setIsModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formId || !formName || !formGrade || !formClass) {
      setErrorMsg("모든 필드를 입력해주세요.");
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
          grade: Number(formGrade),
          classNum: Number(formClass),
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "오류가 발생했습니다.");
      } else {
        setIsModalOpen(false);
        await fetchStudents();
      }
    } catch (err) {
      setErrorMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(student: Student) {
    if (!confirm(`정말 삭제하시겠습니까?\n[${student.id} ${student.name}]\n이 학생의 제출 이력(${student._count.submissions}건)도 모두 삭제됩니다.`)) return;
    
    try {
      const res = await fetch(`/api/teacher/students/${student.id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchStudents();
      } else {
        alert("삭제 중 오류가 발생했습니다.");
      }
    } catch (e) {
      alert("네트워크 오류가 발생했습니다.");
    }
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>학생 관리</h1>
          <p style={styles.pageSubtitle}>학생 계정을 추가하거나 정보를 수정/삭제할 수 있습니다.</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary" style={{ background: "#0f766e" }}>
          + 새 학생 추가
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: 24 }}>
        <input 
          type="text"
          placeholder="이름, 학번, 학년, 반으로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <div className="spinner" style={{ width: 36, height: 36, borderTopColor: "#0f766e", borderColor: "#e2e8f0", margin: "0 auto" }} />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>검색 결과가 없습니다.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <tr>
                  <th style={styles.th}>학번</th>
                  <th style={styles.th}>이름</th>
                  <th style={styles.th}>학년/반</th>
                  <th style={styles.th}>제출 수</th>
                  <th style={styles.th}>관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ ...styles.td, fontWeight: 700, color: "#475569" }}>{s.id}</td>
                    <td style={{ ...styles.td, fontWeight: 800, color: "#0f172a" }}>{s.name}</td>
                    <td style={styles.td}>
                      <span style={styles.badge}>{s.grade}학년 {s.classNum}반</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontWeight: 600, color: s._count.submissions > 0 ? "#0f766e" : "#94a3b8" }}>
                        {s._count.submissions}건
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => openEditModal(s)} className="btn btn-ghost btn-sm" style={{ padding: "4px 10px", fontSize: 12 }}>
                          ✏️ 수정
                        </button>
                        <button onClick={() => handleDelete(s)} className="btn btn-sm" style={{ padding: "4px 10px", fontSize: 12, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                          🗑 삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, color: "#0f172a" }}>
              {modalMode === "ADD" ? "새 학생 추가" : "학생 정보 수정"}
            </h2>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="label">학번</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="예: 1101"
                  value={formId}
                  onChange={e => setFormId(e.target.value)}
                  disabled={modalMode === "EDIT"}
                  autoFocus
                />
              </div>
              <div>
                <label className="label">이름</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="예: 홍길동"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label className="label">학년</label>
                  <input 
                    type="number" 
                    min={1} max={3}
                    className="input" 
                    value={formGrade}
                    onChange={e => setFormGrade(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">반</label>
                  <input 
                    type="number" 
                    min={1} max={20}
                    className="input" 
                    value={formClass}
                    onChange={e => setFormClass(e.target.value)}
                  />
                </div>
              </div>

              {errorMsg && <div style={{ color: "#dc2626", fontSize: 13, fontWeight: 600 }}>⚠️ {errorMsg}</div>}
              
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost" style={{ flex: 1 }}>
                  취소
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 2, background: "#0f766e" }}>
                  {submitting ? "저장 중..." : "💾 저장"}
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
  pageHeader: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 },
  pageTitle: { fontSize: "clamp(22px,3vw,30px)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" },
  pageSubtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  searchInput: {
    width: "100%", maxWidth: 400, padding: "12px 16px",
    borderRadius: 12, border: "1px solid #cbd5e1",
    fontSize: 15, outline: "none", transition: "border 0.2s"
  },
  tableCard: {
    background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)", overflow: "hidden"
  },
  th: { padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "#475569", textAlign: "left" },
  td: { padding: "14px 16px", fontSize: 14, verticalAlign: "middle" },
  badge: {
    background: "#f1f5f9", color: "#475569", fontSize: 12, fontWeight: 700,
    padding: "4px 8px", borderRadius: 6
  },
  modalOverlay: {
    position: "fixed", inset: 0, zIndex: 100,
    background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
  },
  modal: {
    background: "#fff", borderRadius: 24, padding: "32px 28px",
    width: "100%", maxWidth: 420,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    animation: "scaleIn 0.2s ease",
  }
};
