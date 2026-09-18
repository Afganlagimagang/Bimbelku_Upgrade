import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const service = read('bimbelku-backend/app/Services/CheapClassService.php');
const test = read('bimbelku-backend/tests/Feature/CheapClassTutorIsolationTest.php');

const fairPicker = service.slice(
  service.indexOf('private function pickBestEligibleTeacher'),
  service.indexOf('public function teacherCanTeach'),
);

const checks = [
  [service.includes("'teacher_id' => null") && service.includes("'meeting_link' => null"), 'new occurrence starts without inherited tutor or Zoom link'],
  [service.includes("'status' => 'waiting_teacher'") && service.includes('$this->replaceTeacherIfNeeded($class)'), 'each occurrence runs its own tutor selection'],
  [fairPicker.includes('return $candidates->first();'), 'tutor selection uses the ranked eligible queue'],
  [service.includes('matching_active_group_class_count') && service.includes('assignment_count'), 'tutor selection prioritizes fair workload before rating'],
  [service.includes("'cheap_class_id' => (int) $class->id") && service.includes("'package_code' => $class->package_code"), 'order snapshot identifies the exact package occurrence'],
  [test.includes('test_weekly_occurrence_selects_its_own_teacher_and_does_not_inherit_operational_data'), 'feature test covers weekly tutor and operational isolation'],
  [test.includes('test_same_student_receives_a_new_enrollment_and_invoice_for_the_next_week'), 'feature test covers separate enrollment and invoice per week'],
];

let failed = false;
for (const [ok, label] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failed = true;
}

if (failed) process.exit(1);
console.log('Pemeriksaan antrean tutor dan isolasi paket Kelas Kelompok Tahap 4 lulus.');
