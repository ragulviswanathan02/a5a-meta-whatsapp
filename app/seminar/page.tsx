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
  MapPin, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  Zap,
  Briefcase,
  Search,
  MessageCircle
} from 'lucide-react';
import { FormLead } from '@/lib/types';
import { dbUpsertFormLead } from '@/lib/supabase';
import { getStoredFormLeads, saveStoredFormLeads } from '@/lib/storage';

function SeminarRegistrationContent() {
  const searchParams = useSearchParams();
  const collegeParam = searchParams.get('college') || '';
  const sourceParam = searchParams.get('source') || 'seminar';

  const POPULAR_COLLEGES = [
    'Government College of Engineering, Salem',
    'Sona College of Technology, Salem',
    'Knowledge Institute of Technology (KIOT), Salem',
    'Sri Krishna College of Technology (SKCT), Coimbatore',
    'Sri Krishna College of Engineering & Technology (SKCET)',
    'PSG College of Technology, Coimbatore',
    'Coimbatore Institute of Technology (CIT)',
    'Bannari Amman Institute of Technology (BIT)',
    'Kongu Engineering College, Perundurai',
    'KSR College of Engineering, Tiruchengode',
    'KSR Institute for Engineering and Technology',
    'Paavai Engineering College, Namakkal',
    'Muthayammal Engineering College, Rasipuram',
    'Mahendra Engineering College, Mallasamudram',
    'Excel Engineering College, Komarapalayam',
    'Nandha Engineering College, Erode',
    'Alagappa Chettiar Govt College of Engineering (ACGCET)',
    'Thiagarajar College of Engineering (TCE), Madurai',
    'Other College / Institution'
  ];

  const DEPARTMENTS = [
    'Electrical & Electronics Engineering (EEE)',
    'Electronics & Communication Engineering (ECE)',
    'Mechanical Engineering',
    'Mechatronics Engineering',
    'Robotics & Automation',
    'Electronics & Instrumentation (E&I)',
    'Computer Science / IT / AI',
    'Automobile Engineering',
    'Civil Engineering',
    'Other Branch'
  ];

  const YEARS = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    'Final Year (4th Year)',
    'Passed Out'
  ];

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    collegeSelect: collegeParam ? 'Other College / Institution' : POPULAR_COLLEGES[0],
    collegeOther: collegeParam || '',
    department: 'Electrical & Electronics Engineering (EEE)',
    otherDepartment: '',
    yearOfStudy: 'Final Year (4th Year)',
    employmentStatus: 'seeking_job', // 'seeking_job' | 'working'
    companyName: '',
    designation: '',
    city: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isPassedOut = formData.yearOfStudy === 'Passed Out';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit WhatsApp number.');
      return;
    }

    const resolvedCollege = formData.collegeSelect === 'Other College / Institution'
      ? formData.collegeOther.trim()
      : formData.collegeSelect;

    if (!resolvedCollege) {
      setErrorMessage('Please enter your College or Institution name.');
      return;
    }

    if (!formData.name.trim() || !formData.email.trim() || !formData.city.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (isPassedOut && formData.employmentStatus === 'working' && !formData.companyName.trim()) {
      setErrorMessage('Please specify your current Company Name.');
      return;
    }

    setLoading(true);

    const resolvedDept = formData.department === 'Other Branch' && formData.otherDepartment.trim()
      ? formData.otherDepartment.trim()
      : formData.department;

    let careerSummary = 'Student Participant';
    if (isPassedOut) {
      if (formData.employmentStatus === 'working') {
        careerSummary = `Working: ${formData.companyName.trim()}${formData.designation.trim() ? ` (${formData.designation.trim()})` : ''}`;
      } else {
        careerSummary = 'Passed Out • Seeking Core Job Opportunities';
      }
    }

    const newLead: FormLead = {
      id: `seminar-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`,
      collegeName: resolvedCollege,
      department: resolvedDept,
      yearOfStudy: formData.yearOfStudy,
      courseInterest: careerSummary,
      city: formData.city.trim(),
      source: 'seminar',
      employmentStatus: isPassedOut ? (formData.employmentStatus as any) : 'student',
      companyName: isPassedOut && formData.employmentStatus === 'working' ? formData.companyName.trim() : undefined,
      designation: isPassedOut && formData.employmentStatus === 'working' ? formData.designation.trim() : undefined,
      status: 'new',
      notes: [
        {
          id: `sn-${Date.now()}`,
          author: 'Seminar Registration System',
          createdAt: new Date().toISOString(),
          text: `Seminar Registration. College: ${resolvedCollege} | Dept: ${resolvedDept} | Year: ${formData.yearOfStudy}. ${careerSummary}`,
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const stored = getStoredFormLeads();
      saveStoredFormLeads([newLead, ...stored]);
      await dbUpsertFormLead(newLead);

      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage('Could not record registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          maxWidth: '520px',
          width: '100%',
          padding: '40px 28px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
          border: '1px solid #86efac'
        }}>
          <div style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            background: '#dcfce7',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <CheckCircle2 size={44} />
          </div>

          <span style={{
            display: 'inline-block',
            padding: '4px 14px',
            background: '#dcfce7',
            color: '#15803d',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 800,
            letterSpacing: '0.05em',
            marginBottom: '12px'
          }}>
            SEMINAR REGISTRATION CONFIRMED
          </span>

          <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', marginBottom: '10px' }}>
            You&apos;re All Set, {formData.name.split(' ')[0]}! 🎉
          </h2>

          <p style={{ color: '#475569', fontSize: '0.94rem', lineHeight: '1.6', marginBottom: '24px' }}>
            Your registration has been confirmed. You are eligible for participation verification and presentation resource access.
          </p>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'left',
            marginBottom: '24px',
            fontSize: '0.88rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Institution:</span>
              <strong style={{ color: '#1e293b' }}>
                {formData.collegeSelect === 'Other College / Institution' ? formData.collegeOther : formData.collegeSelect}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Department:</span>
              <strong style={{ color: '#1e293b' }}>{formData.department}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ color: '#64748b' }}>Status:</span>
              <strong style={{ color: '#16a34a' }}>Registered Attendee</strong>
            </div>
          </div>

          <a
            href="https://wa.me/919025489166?text=Hi%20A5%20Automation,%20I%20have%20registered%20for%20the%20college%20seminar."
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              background: '#25D366',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)'
            }}
          >
            <MessageCircle size={20} />
            <span>Connect with A5 Automation on WhatsApp</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      padding: '24px 16px 60px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '620px', margin: '0 auto' }}>
        
        {/* Top Header Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '28px 24px',
          textAlign: 'center',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: '#ecfdf5', borderRadius: '20px', color: '#047857', fontSize: '0.78rem', fontWeight: 800, marginBottom: '12px' }}>
            <Award size={14} />
            <span>A5 AUTOMATION • INSTITUTIONAL SEMINAR SERIES</span>
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 10px 0' }}>
            Seminar &amp; Workshop Registration
          </h1>

          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
            Enter your details below to confirm attendance, receive presentation notes, and access core engineering career pathways.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #f1f5f9'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#059669' }}>100% Practical</div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Live Demo &amp; Hardware</div>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0284c7' }}>Core Placements</div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Direct Industry Connect</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#7c3aed' }}>Govt / ISO</div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Certified Institute</div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '30px 24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0'
        }}>
          {errorMessage && (
            <div style={{
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              color: '#b91c1c',
              fontSize: '0.86rem',
              fontWeight: 600,
              marginBottom: '20px'
            }}>
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Full Name */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                <User size={15} color="#059669" />
                <span>Full Name *</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Senthil Kumar R"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* WhatsApp Mobile Number */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                <Phone size={15} color="#059669" />
                <span>WhatsApp Mobile Number *</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{
                  padding: '12px 14px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#475569'
                }}>
                  +91
                </span>
                <input
                  type="tel"
                  required
                  placeholder="10-digit WhatsApp number"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })}
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.92rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <p style={{ fontSize: '0.74rem', color: '#64748b', margin: '4px 0 0 0' }}>
                We will share PPT slides and demo links directly on your WhatsApp.
              </p>
            </div>

            {/* Email Address */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                <Mail size={15} color="#059669" />
                <span>Email Address *</span>
              </label>
              <input
                type="email"
                required
                placeholder="e.g. senthil.k@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* City / Current Location */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                <MapPin size={15} color="#059669" />
                <span>City / Location *</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Salem, Coimbatore, Erode, Namakkal"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* College / Institution Name */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                <Building size={15} color="#059669" />
                <span>College / Institution Name *</span>
              </label>
              <select
                value={formData.collegeSelect}
                onChange={(e) => setFormData({ ...formData, collegeSelect: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  background: '#ffffff',
                  boxSizing: 'border-box'
                }}
              >
                {POPULAR_COLLEGES.map((col, idx) => (
                  <option key={idx} value={col}>{col}</option>
                ))}
              </select>

              {/* Dynamic input if "Other" is chosen */}
              {formData.collegeSelect === 'Other College / Institution' && (
                <div style={{ marginTop: '10px' }}>
                  <input
                    type="text"
                    required
                    placeholder="Type your complete college / polytechnic name..."
                    value={formData.collegeOther}
                    onChange={(e) => setFormData({ ...formData, collegeOther: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #059669',
                      background: '#f0fdf4',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Department */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                <BookOpen size={15} color="#059669" />
                <span>Department / Branch *</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  background: '#ffffff',
                  boxSizing: 'border-box'
                }}
              >
                {DEPARTMENTS.map((dept, idx) => (
                  <option key={idx} value={dept}>{dept}</option>
                ))}
              </select>

              {formData.department === 'Other Branch' && (
                <div style={{ marginTop: '10px' }}>
                  <input
                    type="text"
                    placeholder="Type your branch / department..."
                    value={formData.otherDepartment}
                    onChange={(e) => setFormData({ ...formData, otherDepartment: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #059669',
                      background: '#f0fdf4',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Year of Study */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                <GraduationCap size={15} color="#059669" />
                <span>Year of Study *</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {YEARS.map((yr, idx) => {
                  const selected = formData.yearOfStudy === yr;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, yearOfStudy: yr })}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: selected ? '2px solid #059669' : '1px solid #cbd5e1',
                        background: selected ? '#ecfdf5' : '#ffffff',
                        color: selected ? '#047857' : '#475569',
                        fontWeight: selected ? 800 : 500,
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conditional Passed Out Section */}
            {isPassedOut && (
              <div style={{
                padding: '18px',
                background: '#faf5ff',
                border: '1.5px solid #c084fc',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Briefcase size={16} />
                  <span>Graduate Career Status *</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, employmentStatus: 'seeking_job' })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: formData.employmentStatus === 'seeking_job' ? '2px solid #7c3aed' : '1px solid #e9d5ff',
                      background: formData.employmentStatus === 'seeking_job' ? '#7c3aed' : '#ffffff',
                      color: formData.employmentStatus === 'seeking_job' ? '#ffffff' : '#6b21a8',
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      cursor: 'pointer'
                    }}
                  >
                    🔍 Seeking Core Job
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, employmentStatus: 'working' })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: formData.employmentStatus === 'working' ? '2px solid #7c3aed' : '1px solid #e9d5ff',
                      background: formData.employmentStatus === 'working' ? '#7c3aed' : '#ffffff',
                      color: formData.employmentStatus === 'working' ? '#ffffff' : '#6b21a8',
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      cursor: 'pointer'
                    }}
                  >
                    🏢 Currently Working
                  </button>
                </div>

                {formData.employmentStatus === 'working' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4c1d95', marginBottom: '4px', display: 'block' }}>
                        Company / Organization Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tata Electronics, Foxconn, L&T, JSW"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid #c084fc',
                          fontSize: '0.9rem',
                          background: '#ffffff',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4c1d95', marginBottom: '4px', display: 'block' }}>
                        Current Designation / Role (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Graduate Engineer Trainee, Maintenance Tech"
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid #c084fc',
                          fontSize: '0.9rem',
                          background: '#ffffff',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s ease',
                marginTop: '10px'
              }}
            >
              {loading ? (
                <span>Confirming Registration...</span>
              ) : (
                <>
                  <Send size={18} />
                  <span>Confirm Seminar Registration</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: 'center', marginTop: '24px', color: '#64748b', fontSize: '0.78rem' }}>
          <p style={{ margin: '0 0 6px 0' }}>
            🔒 Verified Industrial Training Partner • A5 Automation, Salem, Tamil Nadu
          </p>
          <p style={{ margin: 0, opacity: 0.8 }}>
            Direct Helpline: +91 90254 89166 / +91 73582 89166
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SeminarRegistrationPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f8fafc' }} />}>
      <SeminarRegistrationContent />
    </Suspense>
  );
}

