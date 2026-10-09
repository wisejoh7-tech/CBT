import * as XLSX from 'xlsx';
import { Attempt, Candidate, Exam } from '@/src/types';

export interface FormattedResultRow {
  'Exam Number': string;
  'Full Name': string;
  'Email': string;
  'Phone Number': string;
  'Subject Combination': string;
  'Exam / Subject': string;
  'Score': number | string;
  'Total Possible': number | string;
  'Percentage Score': string;
  'Status': string;
  'Release Status': string;
  'Trust Score': string;
  'Started At': string;
  'Completed At': string;
}

/**
 * Format completed or selected attempts for export
 */
export function formatResultData(
  attempts: Attempt[],
  candidates: Candidate[],
  exams: Exam[] = []
): FormattedResultRow[] {
  return attempts.map(attempt => {
    const candidate = candidates.find(
      c => c.examNumber === attempt.userId || c.id === attempt.userId
    );
    const exam = exams.find(e => e.id === attempt.examId);
    const examTitle = exam
      ? `${exam.title} (${exam.subject})`
      : attempt.examId === 'unified'
      ? 'Unified Standard Exam'
      : attempt.examId || 'General Assessment';

    const isReleased = Boolean(attempt.released || attempt.isReleased);
    const percentage =
      attempt.totalPossible > 0
        ? `${((attempt.score / attempt.totalPossible) * 100).toFixed(2)}%`
        : '0%';

    return {
      'Exam Number': candidate?.examNumber || attempt.userId,
      'Full Name': candidate?.fullName || 'N/A',
      'Email': candidate?.email || 'N/A',
      'Phone Number': candidate?.phoneNumber || 'N/A',
      'Subject Combination': candidate?.subjectCombination?.join(', ') || 'N/A',
      'Exam / Subject': examTitle,
      'Score': attempt.score,
      'Total Possible': attempt.totalPossible,
      'Percentage Score': percentage,
      'Status': attempt.status?.toUpperCase() || 'N/A',
      'Release Status': isReleased ? 'PUBLISHED' : 'PENDING',
      'Trust Score':
        attempt.trustScore != null
          ? `${Math.round(attempt.trustScore)}%`
          : '100%',
      'Started At': attempt.startedAt
        ? new Date(attempt.startedAt).toLocaleString()
        : 'N/A',
      'Completed At': attempt.completedAt
        ? new Date(attempt.completedAt).toLocaleString()
        : 'N/A',
    };
  });
}

/**
 * Format all candidates with their highest/latest exam score for comprehensive export
 */
export function formatAllCandidatesResultData(
  candidates: Candidate[],
  attempts: Attempt[],
  exams: Exam[] = []
): FormattedResultRow[] {
  return candidates.map(candidate => {
    const candidateAttempts = attempts.filter(
      a => a.userId === candidate.examNumber || a.userId === candidate.id
    );
    // Sort to get latest completed attempt if present
    const attempt =
      candidateAttempts.find(a => a.status === 'completed') || candidateAttempts[0];

    const exam = attempt ? exams.find(e => e.id === attempt.examId) : null;
    const examTitle = exam
      ? `${exam.title} (${exam.subject})`
      : attempt
      ? attempt.examId === 'unified'
        ? 'Unified Standard Exam'
        : attempt.examId
      : 'N/A';

    const isReleased = attempt ? Boolean(attempt.released || attempt.isReleased) : false;
    const percentage =
      attempt && attempt.totalPossible > 0
        ? `${((attempt.score / attempt.totalPossible) * 100).toFixed(2)}%`
        : 'N/A';

    return {
      'Exam Number': candidate.examNumber,
      'Full Name': candidate.fullName,
      'Email': candidate.email || 'N/A',
      'Phone Number': candidate.phoneNumber || 'N/A',
      'Subject Combination': candidate.subjectCombination?.join(', ') || 'N/A',
      'Exam / Subject': examTitle,
      'Score': attempt ? attempt.score : 'N/A',
      'Total Possible': attempt ? attempt.totalPossible : 'N/A',
      'Percentage Score': percentage,
      'Status': attempt ? attempt.status.toUpperCase() : 'NOT ATTEMPTED',
      'Release Status': attempt ? (isReleased ? 'PUBLISHED' : 'PENDING') : 'N/A',
      'Trust Score':
        attempt?.trustScore != null
          ? `${Math.round(attempt.trustScore)}%`
          : 'N/A',
      'Started At': attempt?.startedAt
        ? new Date(attempt.startedAt).toLocaleString()
        : 'N/A',
      'Completed At': attempt?.completedAt
        ? new Date(attempt.completedAt).toLocaleString()
        : 'N/A',
    };
  });
}

/**
 * Download formatted data array as CSV file
 */
export function downloadCSV(data: Record<string, any>[], filename: string): void {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

  // Data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] ?? '';
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  // UTF-8 BOM (\uFEFF) ensures Excel opens special characters correctly
  const csvContent = '\uFEFF' + csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download formatted data array as Excel (.xlsx) file
 */
export function downloadExcel(
  data: Record<string, any>[],
  filename: string,
  sheetName: string = 'Student Results'
): void {
  if (!data || data.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Auto column width calculation
  const headers = Object.keys(data[0]);
  const colWidths = headers.map(key => {
    const maxLen = Math.max(
      key.length,
      ...data.map(row => String(row[key] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
  });
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(
    workbook,
    filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  );
}
