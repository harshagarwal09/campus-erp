// ─── Student validation (mirrors Express validateStudent exactly) ────────────

export interface StudentPayload {
  studentId?: unknown;
  name?: unknown;
  email?: unknown;
  roll?: unknown;
  branch?: unknown;
  phone?: unknown;
  dob?: unknown;
  cgpa?: unknown;
  enrollmentYear?: unknown;
  guardianPhone?: unknown;
  backlogs?: unknown;
  attendancePercentage?: unknown;
  address?: unknown;
  city?: unknown;
  state?: unknown;
  gender?: unknown;
  bloodGroup?: unknown;
  category?: unknown;
  semester?: unknown;
  section?: unknown;
  specialization?: unknown;
  batch?: unknown;
  tenthPercentage?: unknown;
  twelfthPercentage?: unknown;
  hostelDayScholar?: unknown;
  skills?: unknown;
  interests?: unknown;
  linkedinUrl?: unknown;
  githubUrl?: unknown;
  lookingForTeam?: unknown;
  availability?: unknown;
  domain?: unknown;
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface ValidatedStudent {
  studentId: string;
  name: string;
  email: string;
  roll: string;
  branch: string;
  phone: string;
  dob: string;
  address: string | null;
  city: string | null;
  state: string | null;
  cgpa: string;
  enrollmentYear: string;
  guardianPhone: string | null;
  gender: string | null;
  bloodGroup: string | null;
  category: string | null;
  semester: number | null;
  section: string | null;
  specialization: string | null;
  batch: string | null;
  backlogs: number | null;
  attendancePercentage: string | null;
  tenthPercentage: string | null;
  twelfthPercentage: string | null;
  hostelDayScholar: string | null;
  skills: string | null;
  interests: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  lookingForTeam: boolean;
  availability: string | null;
  domain: string | null;
}

const norm = (v: unknown): string =>
  typeof v === 'string' ? v.trim() : v == null ? '' : String(v);

export function validateStudent(payload: StudentPayload): {
  errors: ValidationErrors;
  normalized: ValidatedStudent;
} {
  const errors: ValidationErrors = {};

  const studentId = norm(payload.studentId);
  const name = norm(payload.name);
  const email = norm(payload.email);
  const roll = norm(payload.roll);
  const branch = norm(payload.branch);
  const phone = norm(payload.phone);
  const dob = norm(payload.dob);
  const cgpa = norm(payload.cgpa);
  const enrollmentYear = norm(payload.enrollmentYear);
  const guardianPhone = norm(payload.guardianPhone) || null;
  const backlogs = norm(payload.backlogs) || null;
  const attendancePercentage = norm(payload.attendancePercentage) || null;

  if (!studentId) errors.studentId = 'Student ID is required';
  if (!name) errors.name = 'Name is required';
  if (!email) {
    errors.email = 'Email is required';
  } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    errors.email = 'Invalid email';
  }
  if (!roll) errors.roll = 'Roll number is required';
  if (!branch) errors.branch = 'Branch is required';
  if (!phone) {
    errors.phone = 'Phone is required';
  } else if (!/^\d{10}$/.test(phone)) {
    errors.phone = 'Phone must be 10 digits';
  }
  if (!dob) {
    errors.dob = 'DOB is required';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    errors.dob = 'Use YYYY-MM-DD';
  } else {
    const date = new Date(dob);
    if (Number.isNaN(date.getTime())) {
      errors.dob = 'Invalid date';
    } else {
      if (date > new Date()) errors.dob = 'DOB cannot be in the future';
      if (date.getFullYear() < 1900) errors.dob = 'Year seems too old';
    }
  }
  if (!cgpa) {
    errors.cgpa = 'CGPA is required';
  } else {
    const v = parseFloat(cgpa);
    if (Number.isNaN(v) || v < 0 || v > 10) errors.cgpa = 'CGPA must be between 0 and 10';
  }
  if (!enrollmentYear) {
    errors.enrollmentYear = 'Enrollment year is required';
  } else if (!/^\d{4}$/.test(enrollmentYear)) {
    errors.enrollmentYear = 'Use YYYY format';
  } else {
    const y = parseInt(enrollmentYear, 10);
    const thisYear = new Date().getFullYear();
    if (y < 1900 || y > thisYear)
      errors.enrollmentYear = `Year must be between 1900 and ${thisYear}`;
  }
  if (guardianPhone && !/^\d{10}$/.test(guardianPhone))
    errors.guardianPhone = 'Guardian phone must be 10 digits';
  if (backlogs) {
    const v = parseInt(backlogs, 10);
    if (Number.isNaN(v) || v < 0) errors.backlogs = 'Backlogs must be 0 or greater';
  }
  if (attendancePercentage) {
    const v = parseFloat(attendancePercentage);
    if (Number.isNaN(v) || v < 0 || v > 100)
      errors.attendancePercentage = 'Attendance must be between 0 and 100';
  }

  const normalized: ValidatedStudent = {
    studentId,
    name,
    email,
    roll,
    branch,
    phone,
    dob,
    address: norm(payload.address) || null,
    city: norm(payload.city) || null,
    state: norm(payload.state) || null,
    cgpa,
    enrollmentYear,
    guardianPhone,
    gender: norm(payload.gender) || null,
    bloodGroup: norm(payload.bloodGroup) || null,
    category: norm(payload.category) || null,
    semester: payload.semester ? parseInt(norm(payload.semester), 10) : null,
    section: norm(payload.section) || null,
    specialization: norm(payload.specialization) || null,
    batch: norm(payload.batch) || null,
    backlogs: backlogs ? parseInt(backlogs, 10) : null,
    attendancePercentage: attendancePercentage || null,
    tenthPercentage: norm(payload.tenthPercentage) || null,
    twelfthPercentage: norm(payload.twelfthPercentage) || null,
    hostelDayScholar: norm(payload.hostelDayScholar) || null,
    skills: norm(payload.skills) || null,
    interests: norm(payload.interests) || null,
    linkedinUrl: norm(payload.linkedinUrl) || null,
    githubUrl: norm(payload.githubUrl) || null,
    lookingForTeam:
      payload.lookingForTeam === true ||
      payload.lookingForTeam === 'true' ||
      payload.lookingForTeam === 1 ||
      payload.lookingForTeam === '1',
    availability: norm(payload.availability) || null,
    domain: norm(payload.domain) || null,
  };

  return { errors, normalized };
}
