export interface ApprovedAverageMatch {
  campus: string;
  code: string;
  dni: string;
  career: string;
  career_code: string;
  specialty: string;
  curriculum: string;
}

export interface ApprovedAveragePreviewRow {
  identifier: string;
  code: string;
  dni: string;
  name: string;
  average: number | '';
  campus: string;
  career: string;
  specialty: string;
  credits: number;
  courses: number;
  status: string;
  observation: string;
  included: boolean;
  matches: ApprovedAverageMatch[];
}

export interface ApprovedAveragePreview {
  rows: ApprovedAveragePreviewRow[];
  observations: Array<{
    identifier: string;
    observation: string;
  }>;
}
