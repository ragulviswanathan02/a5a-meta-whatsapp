'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  CheckCircle2, 
  Send, 
  GraduationCap, 
  User, 
  Mail, 
  Phone, 
  Building, 
  BookOpen, 
  Calendar, 
  MapPin, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  Zap,
  MessageCircle
} from 'lucide-react';
import { FormLead } from '@/lib/types';
import { dbUpsertFormLead } from '@/lib/supabase';
import { getStoredFormLeads, saveStoredFormLeads } from '@/lib/storage';

function LeadCaptureFormContent() {
  const searchParams = useSearchParams();
  const sourceParam = searchParams.get('source') || searchParams.get('utm_source') || 'social_media';

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    collegeName: '',
    department: 'Electrical & Electronics Engineering (EEE)',
    otherDepartment: '',
    yearOfStudy: 'Final Year',
    courseInterest: 'All-in-One Industrial Automation (PLC + SCADA + HMI + VFD)',
    city: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const DEPARTMENTS = [
    'Electrical & Electronics Engineering (EEE)',
    'Electronics & Communication Engineering (ECE)',
    'Mechanical Engineering',
    'Mechatronics Engineering',
    'Robotics & Automation',
    'Electronics & Instrumentation (E&I)',
    'Computer Science / IT',
    'Automobile Engineering',
    'Civil Engineering',
    'Other Branch'
  ];

  const YEARS = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    'Final Year (4th Year)',
    'Passed Out / Fresh Graduate',
    'Working Professional'
  ];

  const COURSES = [
    'All-in-One Industrial Automation (PLC + SCADA + HMI + VFD)',
    'PLC Programming & Industrial Controllers',
    'SCADA Training & Industrial Networking',
    'Motion Control & Panel Designing',
    'Process Instrumentation & DCS',
    'Internship & Final Year Academic Project Training',
    '100% Placement Guaranteed Career Course'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit WhatsApp number.');
      return;
    }

    if (!formData.name.trim() || !formData.email.trim() || !formData.collegeName.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    const resolvedDept = formData.department === 'Other Branch' && formData.otherDepartment.trim()
      ? formData.otherDepartment.trim()
      : formData.department;

    const newLead: FormLead = {
      id: `form-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`,
      collegeName: formData.collegeName.trim(),
      department: resolvedDept,
      yearOfStudy: formData.yearOfStudy,
      courseInterest: formData.courseInterest,
      city: formData.city.trim() || 'Tamil Nadu',
      source: sourceParam,
      status: 'new',
      notes: [
        {
          id: `fn-${Date.now()}`,
          author: 'Student Form Link',
          text: `Applied via social link (${sourceParam}) for ${formData.courseInterest}`,
          createdAt: new Date().toISOString(),
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // 1. Save to local fallback cache
      const localList = getStoredFormLeads();
      saveStoredFormLeads([newLead, ...localList]);

      // 2. Persist to Supabase Database
      await dbUpsertFormLead(newLead);

      setSubmitted(true);
    } catch (err: any) {
      console.error('Form submission error:', err);
      // Still show success since local storage saved it
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: '580px', margin: '40px auto', padding: '0 16px' }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '40px 28px',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.07), 0 0 1px 1px rgba(0,0,0,0.05)',
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          {/* Animated Celebration Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
            color: '#ffffff'
          }}>
            <CheckCircle2 size={44} strokeWidth={2.5} />
          </div>

          <span style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#059669',
            background: '#ecfdf5',
            padding: '6px 14px',
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Application Received Successfully
          </span>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '16px', marginBottom: '8px' }}>
            Thank You, {formData.name.split(' ')[0]}!
          </h2>

          <p style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: 1.6, maxWidth: '440px', margin: '0 auto 24px' }}>
            We have received your interest in <strong>{formData.courseInterest}</strong>. Our senior technical mentor will reach out to you via WhatsApp / Call with the complete syllabus and placement details.
          </p>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'left',
            marginBottom: '28px'
          }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '10px', textTransform: 'uppercase' }}>
              Your Application Summary
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', fontSize: '0.88rem' }}>
              <div style={{ color: '#64748b' }}>
                <strong style={{ color: '#0f172a' }}>College:</strong> {formData.collegeName}
              </div>
              <div style={{ color: '#64748b' }}>
                <strong style={{ color: '#0f172a' }}>Department:</strong> {formData.department === 'Other Branch' ? formData.otherDepartment : formData.department} ({formData.yearOfStudy})
              </div>
              <div style={{ color: '#64748b' }}>
                <strong style={{ color: '#0f172a' }}>WhatsApp:</strong> {formData.phone}
              </div>
            </div>
          </div>

          {/* Direct WhatsApp Call to Action */}
          <a
            href={`https://wa.me/917358289166?text=Hi%20A5A%20Automation%2C%20I%20am%20${encodeURIComponent(formData.name)}%20from%20${encodeURIComponent(formData.collegeName)}.%20I%20just%20filled%20the%20application%20form%20for%20Industrial%20Automation%20training%20and%20wanted%20to%20connect!`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              background: '#25D366',
              borderColor: '#25D366',
              color: '#ffffff',
              boxShadow: '0 8px 20px -4px rgba(37, 211, 102, 0.4)'
            }}
          >
            <MessageCircle size={20} />
            Chat with A5A Team on WhatsApp (+91 73582 89166)
          </a>

          <div style={{ marginTop: '20px' }}>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  name: '',
                  phone: '',
                  email: '',
                  collegeName: '',
                  department: 'Electrical & Electronics Engineering (EEE)',
                  otherDepartment: '',
                  yearOfStudy: 'Final Year',
                  courseInterest: 'All-in-One Industrial Automation (PLC + SCADA + HMI + VFD)',
                  city: '',
                });
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Submit another application
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: 'center', marginTop: '24px', color: '#94a3b8', fontSize: '0.82rem' }}>
          &copy; {new Date().getFullYear()} A5A Automation • Advanced Analytical Accessible Affirmative Academy
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0fdf4 0%, #f8fafc 100%)', padding: '30px 16px 60px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        
        {/* Header Branding Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '28px 24px',
          textAlign: 'center',
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          marginBottom: '20px'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <img 
              src="https://a5automation.com/wp-content/uploads/2026/04/A5A-Automation-Industrial-Training-logo.png" 
              alt="A5A Automation Logo" 
              style={{ maxHeight: '72px', width: 'auto', objectFit: 'contain' }}
            />
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ecfdf5',
            color: '#059669',
            fontSize: '0.78rem',
            fontWeight: 700,
            padding: '5px 12px',
            borderRadius: '999px',
            marginBottom: '12px'
          }}>
            <Sparkles size={14} />
            <span>A5A ACADEMY • INDUSTRIAL AUTOMATION & PLACEMENT</span>
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3, marginBottom: '8px' }}>
            Take Your Engineering Career To The Next Level
          </h1>
          
          <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: 1.5, margin: '0 auto', maxWidth: '520px' }}>
            Master Hands-on <strong>PLC Programming, SCADA, HMI, VFD & Industrial Robotics</strong> with industry experts and 100% placement support in Salem.
          </p>

          {/* Quick Perks */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '8px', 
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px dashed #e2e8f0'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#059669', fontWeight: 700, fontSize: '0.85rem' }}>100% Practical</div>
              <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Hardware Kits</div>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
              <div style={{ color: '#059669', fontWeight: 700, fontSize: '0.85rem' }}>Core Placement</div>
              <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Assistance</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#059669', fontWeight: 700, fontSize: '0.85rem' }}>Govt / ISO</div>
              <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Certification</div>
            </div>
          </div>
        </div>

        {/* Main Application Form */}
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '32px 28px',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.06)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Student Registration & Inquiry Form
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
              Fill in your details below to receive the free syllabus, fee discount, and batch schedule.
            </p>
          </div>

          {errorMessage && (
            <div style={{
              background: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '0.88rem',
              marginBottom: '20px'
            }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            {/* WhatsApp Phone Number */}
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                WhatsApp Mobile Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: '#059669'
                }}>
                  +91
                </span>
                <input
                  type="tel"
                  required
                  placeholder="98765 43210"
                  className="form-input"
                  style={{ paddingLeft: '50px' }}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                We will share the course curriculum and video demos directly on WhatsApp.
              </span>
            </div>

            {/* Email Address */}
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Email Address <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* College / University Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                College / Institution Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Building size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Government College of Engineering, Salem"
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                  value={formData.collegeName}
                  onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                />
              </div>
            </div>

            {/* Department / Branch */}
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Department / Engineering Branch <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <GraduationCap size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <select
                  className="form-select"
                  style={{ paddingLeft: '42px' }}
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {formData.department === 'Other Branch' && (
                <input
                  type="text"
                  placeholder="Specify your department..."
                  className="form-input"
                  style={{ marginTop: '8px' }}
                  value={formData.otherDepartment}
                  onChange={(e) => setFormData({ ...formData, otherDepartment: e.target.value })}
                />
              )}
            </div>

            {/* Year of Study */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Year of Study / Current Status <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <select
                    className="form-select"
                    style={{ paddingLeft: '42px' }}
                    value={formData.yearOfStudy}
                    onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value })}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Course of Interest */}
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Program / Training of Interest <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <BookOpen size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <select
                  className="form-select"
                  style={{ paddingLeft: '42px' }}
                  value={formData.courseInterest}
                  onChange={(e) => setFormData({ ...formData, courseInterest: e.target.value })}
                >
                  {COURSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* City / Native District */}
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Your City / District
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="e.g. Salem, Namakkal, Erode, Coimbatore"
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ marginTop: '12px' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  borderRadius: '14px',
                  boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.4)'
                }}
              >
                {loading ? (
                  <span>Submitting Application...</span>
                ) : (
                  <>
                    <span>Submit & Get Syllabus on WhatsApp</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>

            {/* Privacy note */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.78rem' }}>
              <ShieldCheck size={16} color="#059669" />
              <span>100% Privacy Protected. Your number is never shared with third parties.</span>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '30px', color: '#64748b', fontSize: '0.82rem', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 700, color: '#334155' }}>A5A Automation Industrial Training Center</div>
          <div>Salem, Tamil Nadu • Advanced Analytical Accessible Affirmative Academy</div>
          <div style={{ marginTop: '4px', color: '#94a3b8' }}>&copy; {new Date().getFullYear()} A5A Automation. All rights reserved.</div>
        </div>

      </div>
    </div>
  );
}

export default function LeadCaptureFormPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', color: '#059669' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontWeight: 600 }}>Loading A5A Application Portal...</p>
        </div>
      </div>
    }>
      <LeadCaptureFormContent />
    </Suspense>
  );
}
