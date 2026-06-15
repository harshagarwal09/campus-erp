'use client';

import { useState, useEffect, type ChangeEvent } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type FormData = {
  studentId: string;
  name: string;
  email: string;
  roll: string;
  branch: string;
  phone: string;
  dob: string;
  address: string;
  city: string;
  state: string;
  cgpa: string;
  enrollmentYear: string;
  guardianPhone: string;
  gender: string;
  bloodGroup: string;
  category: string;
  semester: string;
  section: string;
  specialization: string;
  batch: string;
  tenthPercentage: string;
  twelfthPercentage: string;
  backlogs: string;
  attendancePercentage: string;
  hostelDayScholar: string;
  skills: string;
  interests: string;
  linkedinUrl: string;
  githubUrl: string;
  lookingForTeam: boolean;
  availability: string;
  domain: string;
};

interface Props {
  editingStudent: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => void;
  onClose: () => void;
}

// ─── Default form ─────────────────────────────────────────────────────────────

const emptyForm: FormData = {
  studentId: '', name: '', email: '', roll: '', branch: '', phone: '',
  dob: '', address: '', city: '', state: '', cgpa: '', enrollmentYear: '',
  guardianPhone: '', gender: '', bloodGroup: '', category: '', semester: '',
  section: '', specialization: '', batch: '', tenthPercentage: '', twelfthPercentage: '',
  backlogs: '', attendancePercentage: '', hostelDayScholar: '', skills: '', interests: '',
  linkedinUrl: '', githubUrl: '', lookingForTeam: false, availability: '', domain: '',
};

// ─── Field-level validation ───────────────────────────────────────────────────

function validateField(name: string, value: unknown, editingId?: unknown): string {
  const v = typeof value === 'string' ? value.trim() : value;

  if (['name', 'email', 'roll', 'branch', 'phone', 'dob', 'studentId', 'cgpa', 'enrollmentYear'].includes(name)) {
    if (!v) return 'This field is required';
  }
  if (name === 'email') {
    if (v && !/^[^@\s]+@[^\s]+\.[^@\s]+$/.test(String(v))) return 'Invalid email';
  }
  if (name === 'phone') {
    if (v && !/^\d{10}$/.test(String(v))) return 'Phone must be 10 digits';
  }
  if (name === 'guardianPhone') {
    if (v && !/^\d{10}$/.test(String(v))) return 'Guardian phone must be 10 digits';
  }
  if (name === 'enrollmentYear') {
    if (v && !/^\d{4}$/.test(String(v))) return 'Use YYYY format';
    if (v) {
      const y = parseInt(String(v), 10);
      const thisYear = new Date().getFullYear();
      if (y < 1900 || y > thisYear) return `Year must be between 1900 and ${thisYear}`;
    }
  }
  if (name === 'dob') {
    if (v && !/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return 'Use YYYY-MM-DD';
    if (v) {
      const d = new Date(String(v));
      if (Number.isNaN(d.getTime())) return 'Invalid date';
      if (d > new Date()) return 'DOB cannot be in the future';
      if (d.getFullYear() < 1900) return 'Year seems too old';
    }
  }
  if (name === 'cgpa') {
    if (v) {
      const n = parseFloat(String(v));
      if (Number.isNaN(n) || n < 0 || n > 10) return 'CGPA must be 0–10';
    }
  }
  return '';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudentFormPage({ editingStudent, onSave, onClose }: Props) {
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (editingStudent) {
      const merged: FormData = { ...emptyForm };
      (Object.keys(emptyForm) as (keyof FormData)[]).forEach((key) => {
        const v = editingStudent[key];
        if (key === 'lookingForTeam') {
          (merged as any)[key] = Boolean(v);
        } else if (key === 'dob' && typeof v === 'string') {
          merged[key] = v.slice(0, 10);
        } else if (v !== null && v !== undefined) {
          (merged as any)[key] = String(v);
        }
      });
      setFormData(merged);
    } else {
      setFormData(emptyForm);
    }
    setErrors({});
    setTouched({});
  }, [editingStudent]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  // Live validation for touched fields
  useEffect(() => {
    const next: Record<string, string> = {};
    (Object.keys(formData) as (keyof FormData)[]).forEach((key) => {
      if (touched[key]) {
        const msg = validateField(key, formData[key], editingStudent?.id);
        if (msg) next[key] = msg;
      }
    });
    setErrors(next);
  }, [formData, touched, editingStudent]);

  const handleSave = () => {
    const next: Record<string, string> = {};
    (Object.keys(formData) as (keyof FormData)[]).forEach((key) => {
      const msg = validateField(key, formData[key], editingStudent?.id);
      if (msg) next[key] = msg;
    });
    if (Object.keys(next).length) {
      setErrors(next);
      const allTouched = (Object.keys(formData) as (keyof FormData)[]).reduce<Record<string, boolean>>(
        (acc, k) => { acc[k] = true; return acc; },
        {}
      );
      setTouched(allTouched);
      return;
    }

    const payload: Record<string, unknown> = Object.fromEntries(
      Object.entries(formData).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
    );
    if (editingStudent?.id) payload.id = editingStudent.id;
    onSave(payload);
  };

  const F = ({ name, label, type = 'text', inputMode, placeholder, optional, children }: {
    name: keyof FormData;
    label: string;
    type?: string;
    inputMode?: string;
    placeholder?: string;
    optional?: boolean;
    children?: React.ReactNode;
  }) => (
    <div className="form-field">
      <label>{label}{optional && <span className="optional-meta"> (optional)</span>}</label>
      {children ?? (
        <input
          name={name}
          type={type}
          inputMode={inputMode as any}
          placeholder={placeholder}
          value={String(formData[name] ?? '')}
          onChange={handleChange}
          autoComplete="off"
        />
      )}
      {errors[name] && <div className="field-error">{errors[name]}</div>}
    </div>
  );

  return (
    <div className="page">
      <div className="page-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <p className="eyebrow">Student form</p>
          <h1>{editingStudent ? 'Edit student profile' : 'Add a new student'}</h1>
          <p className="subtitle">Fill all student details on a single page.</p>
        </div>
        <button className="secondary" onClick={onClose}>Back</button>
      </div>

      <div className="page-card full-width">

        {/* ── Personal Information ─────────────────────────────────────────── */}
        <div className="form-section">
          <h3 className="section-title">Personal Information</h3>
          <div className="form-grid full-width">
            <F name="name" label="Name" />
            <F name="email" label="Email" type="email" />
            <F name="phone" label="Phone" type="tel" inputMode="tel" />
            <F name="dob" label="Date of Birth" type="date" />
          </div>
        </div>

        {/* ── Academic Information ─────────────────────────────────────────── */}
        <div className="form-section">
          <h3 className="section-title">Academic Information</h3>
          <div className="form-grid full-width">
            <F name="studentId" label="Student ID" />
            <F name="roll" label="Roll Number" />
            <F name="branch" label="Branch" />
            <F name="cgpa" label="CGPA" inputMode="decimal" placeholder="0.00" />
            <F name="enrollmentYear" label="Enrollment Year" inputMode="numeric" placeholder="YYYY" />
          </div>
        </div>

        {/* ── Address ──────────────────────────────────────────────────────── */}
        <div className="form-section">
          <h3 className="section-title">Address Information <span className="optional-meta">(all optional)</span></h3>
          <div className="form-grid full-width">
            <F name="address" label="Address" optional />
            <F name="city" label="City" optional />
            <F name="state" label="State" optional />
            <F name="guardianPhone" label="Guardian Phone" type="tel" optional />
          </div>
        </div>

        {/* ── Personal Details ─────────────────────────────────────────────── */}
        <div className="form-section">
          <h3 className="section-title">Personal Details</h3>
          <div className="form-grid full-width">
            <div className="form-field">
              <label>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option value="">Select…</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-field">
              <label>Blood Group</label>
              <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
                <option value="">Select…</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleChange}>
                <option value="">Select…</option>
                {['General','SC','ST','OBC'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Hostel / Day Scholar</label>
              <select name="hostelDayScholar" value={formData.hostelDayScholar} onChange={handleChange}>
                <option value="">Select…</option>
                <option value="Hostel">Hostel</option>
                <option value="Day Scholar">Day Scholar</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Academic Details ─────────────────────────────────────────────── */}
        <div className="form-section">
          <h3 className="section-title">Academic Details</h3>
          <div className="form-grid full-width">
            <div className="form-field">
              <label>Semester</label>
              <select name="semester" value={formData.semester} onChange={handleChange}>
                <option value="">Select…</option>
                {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Section</label>
              <select name="section" value={formData.section} onChange={handleChange}>
                <option value="">Select…</option>
                {['A','B','C','D'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <F name="specialization" label="Specialization" placeholder="e.g., Computer Science" optional />
            <F name="batch" label="Batch" placeholder="e.g., Batch 2024" optional />
            <F name="backlogs" label="Backlogs" type="number" inputMode="numeric" placeholder="0" optional />
            <F name="attendancePercentage" label="Attendance %" inputMode="decimal" placeholder="0.00" optional />
            <F name="tenthPercentage" label="10th Percentage" inputMode="decimal" placeholder="0.00" optional />
            <F name="twelfthPercentage" label="12th Percentage" inputMode="decimal" placeholder="0.00" optional />
          </div>
        </div>

        {/* ── Skills & Interests ────────────────────────────────────────────── */}
        <div className="form-section">
          <h3 className="section-title">Skills & Interests</h3>
          <div className="form-grid full-width">
            <div className="form-field">
              <label>Skills <span className="optional-meta">(comma separated)</span></label>
              <textarea name="skills" rows={2} value={formData.skills} onChange={handleChange}
                placeholder="e.g., JavaScript, React, Node.js" />
            </div>
            <div className="form-field">
              <label>Interests <span className="optional-meta">(comma separated)</span></label>
              <textarea name="interests" rows={2} value={formData.interests} onChange={handleChange}
                placeholder="e.g., Web Development, Open Source" />
            </div>
          </div>
        </div>

        {/* ── Online Profiles ───────────────────────────────────────────────── */}
        <div className="form-section">
          <h3 className="section-title">Online Profiles</h3>
          <div className="form-grid full-width">
            <F name="linkedinUrl" label="LinkedIn URL" type="url" placeholder="https://linkedin.com/in/…" optional />
            <F name="githubUrl" label="GitHub URL" type="url" placeholder="https://github.com/…" optional />
          </div>
        </div>

        {/* ── Availability ──────────────────────────────────────────────────── */}
        <div className="form-section">
          <h3 className="section-title">Availability & Preferences</h3>
          <div className="form-grid full-width">
            <div className="form-field">
              <label>Domain</label>
              <select name="domain" value={formData.domain} onChange={handleChange}>
                <option value="">Select…</option>
                {['Technical','Non-Technical','Cultural','Sports'].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Availability</label>
              <select name="availability" value={formData.availability} onChange={handleChange}>
                <option value="">Select…</option>
                <option value="Available">Available</option>
                <option value="Busy">Busy</option>
              </select>
            </div>
            <div className="form-field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="lookingForTeam"
                  checked={formData.lookingForTeam}
                  onChange={handleChange}
                />
                Looking for Team
              </label>
            </div>
          </div>
        </div>

        {/* ── Actions ───────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="primary" onClick={handleSave}>
            {editingStudent ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
