import os
import re

src_dir = "/home/jaekwan/projects/csat-omr-tracker/src"
new_exam_path = os.path.join(src_dir, "app/teacher/exams/new/page.tsx")
edit_exam_path = os.path.join(src_dir, "app/teacher/exams/[id]/page.tsx")
list_exam_path = os.path.join(src_dir, "app/teacher/exams/page.tsx")

with open(new_exam_path, "r", encoding="utf-8") as f:
    new_content = f.read()

# Make the edit page client component and get the params
# Import useParams
new_content = new_content.replace('import { useRouter } from "next/navigation";', 'import { useRouter, useParams } from "next/navigation";')
new_content = new_content.replace("export default function NewExamPage() {", "export default function EditExamPage() {")

# Extract component body and modify it
# Add state for loading initial data
init_logic = """
  const params = useParams();
  const examId = params.id;
  const [initialLoading, setInitialLoading] = useState(true);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) return;
    fetch(`/api/teacher/exams/${examId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.exam) {
          setSubject(d.exam.subject);
          setTitle(d.exam.title);
          setQuestions(d.exam.questions);
          setExistingPdfUrl(d.exam.explanationPdfUrl);
        }
        setInitialLoading(false);
      })
      .catch(() => setInitialLoading(false));
  }, [examId]);
"""

new_content = new_content.replace(
    "const [subject, setSubject] = useState<string>(\"KOREAN\");",
    "const [subject, setSubject] = useState<string>(\"KOREAN\");\n" + init_logic
)

# Update useEffect to not overwrite questions if we are editing (or just remove the auto-populate if we already fetched)
subject_select = """
                {/* Subject Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-foreground">과목 (수정 불가)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(SUBJECT_CONFIG).map(([s, c]) => {
                      const isActive = subject === s;
                      const Icon = c.icon;
                      return (
                        <div
                          key={s}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200",
                            isActive
                              ? "shadow-sm"
                              : "bg-secondary/40 border-transparent text-muted-foreground opacity-50"
                          )}
                          style={isActive ? { borderColor: SUBJECT_COLOR_HEX[s], background: `${SUBJECT_COLOR_HEX[s]}08`, color: SUBJECT_COLOR_HEX[s] } : undefined}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-bold">{c.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
"""
new_content = re.sub(r'\{\/\* Subject Selection \*\/}.*?(?=\{\/\* Subject Hints \*\/})', subject_select, new_content, flags=re.DOTALL)

# Remove the useEffect that auto-builds questions when subject changes
new_content = re.sub(r'useEffect\(\(\) => \{\n\s+setQuestions\(buildQuestions\(subject\)\);\n\s+\}, \[subject\]\);\n', '', new_content)

# Update submit logic to PUT to /api/teacher/exams/[id]
submit_logic = """
    const res = await fetch(`/api/teacher/exams/${examId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), explanationPdfUrl: explanationPdfUrl || existingPdfUrl, questions }),
    });
"""
new_content = re.sub(r'const res = await fetch\("/api/teacher/exams", \{\n.*?method: "POST",\n.*?body: JSON.stringify\(\{ subject, title: title\.trim\(\), startNum: cfg\.startNum, explanationPdfUrl, questions \}\),\n\s+\}\);', submit_logic, new_content, flags=re.DOTALL)

# Update headers and texts
new_content = new_content.replace('새 시험 등록', '시험 수정')
new_content = new_content.replace('새로운 모의고사나 시험을 등록하세요', '기존 시험의 정답과 배점을 수정하세요')
new_content = new_content.replace('등록 중...', '수정 중...')
new_content = new_content.replace('등록하기', '수정하기')

# Display existing PDF
pdf_section = """
                  <label htmlFor="explanationFile" className="text-sm font-bold text-foreground">해설지 PDF (선택, 새 파일 업로드 시 교체됨)</label>
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="explanationFile" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-input rounded-xl cursor-pointer bg-background hover:bg-secondary/30 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FileText className="w-6 h-6 mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground font-medium text-center">
                          {explanationFile ? (
                            <span className="text-primary font-bold">{explanationFile.name}</span>
                          ) : existingPdfUrl ? (
                            <span className="text-teal-600 font-bold">등록된 해설지가 있습니다.<br/>클릭하여 변경</span>
                          ) : (
                            "클릭하여 PDF 파일 업로드"
                          )}
                        </p>
                      </div>
                      <input
                        id="explanationFile"
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => setExplanationFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
"""
# Note: In new_content, the previous PDF section was something like:
# <label htmlFor="explanationFile" className="text-sm font-bold text-foreground">해설지 PDF (선택)</label>
# <div className="flex items-center justify-center w-full">...</div>
new_content = re.sub(r'<label htmlFor="explanationFile" className="text-sm font-bold text-foreground">해설지 PDF \(선택\)</label>.*?</label>\n\s+</div>', pdf_section, new_content, flags=re.DOTALL)

# Handle initial loading state
loading_overlay = """
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-sm font-bold text-muted-foreground">시험 정보를 불러오는 중...</p>
      </div>
    );
  }
"""
new_content = new_content.replace('return (\n    <div className="min-h-screen', loading_overlay + '\n  return (\n    <div className="min-h-screen')

os.makedirs(os.path.dirname(edit_exam_path), exist_ok=True)
with open(edit_exam_path, "w", encoding="utf-8") as f:
    f.write(new_content)

# Update list page
with open(list_exam_path, "r", encoding="utf-8") as f:
    list_content = f.read()

# Replace Edit button in list
list_content = list_content.replace(
    'onClick={() => startEdit(exam)}',
    'onClick={() => router.push(`/teacher/exams/${exam.id}`)}'
)
list_content = list_content.replace('import Link from "next/link";', 'import Link from "next/link";\nimport { useRouter } from "next/navigation";')
list_content = list_content.replace('export default function TeacherExamsPage() {', 'export default function TeacherExamsPage() {\n  const router = useRouter();')

# Remove modal and related states
list_content = re.sub(r'const \[editingExam, setEditingExam\].*?;\n', '', list_content)
list_content = re.sub(r'const \[editQuestions, setEditQuestions\].*?;\n', '', list_content)
list_content = re.sub(r'const \[editExplanationFile, setEditExplanationFile\].*?;\n', '', list_content)
list_content = re.sub(r'const \[msg, setMsg\].*?;\n', '', list_content)
list_content = re.sub(r'const \[saving, setSaving\].*?;\n', '', list_content)

list_content = re.sub(r'function startEdit\(exam: Exam\) \{.*?\n  \}', '', list_content, flags=re.DOTALL)
list_content = re.sub(r'async function handleSaveEdit\(\) \{.*?\n  \}', '', list_content, flags=re.DOTALL)

# Remove the entire Edit Modal block
edit_modal_match = re.search(r'\{/\* Edit Modal \*/\}.*?(?=\n\n    </div>\n  \);\n\})', list_content, re.DOTALL)
if edit_modal_match:
    list_content = list_content.replace(edit_modal_match.group(0), '')

with open(list_exam_path, "w", encoding="utf-8") as f:
    f.write(list_content)

print("Done")
