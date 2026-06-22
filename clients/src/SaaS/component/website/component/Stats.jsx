// import "./Stats.css";


import React, { useState } from 'react';

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  budget: '',
  companyName: '',
  industry: '',
  teamSize: '',
  timelineWeeks: '',
  projectType: '',
  usersCount: '',
  features: '',
  priority: '',
  delivery: '',
};

const steps = [
  'Profile',
  'Company',
  'Preferences',
  'Review',
];

const Stats = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [finished, setFinished] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateStep = () => {
    let err = {};
    if (step === 0) {
      if (!form.fullName) err.fullName = 'Full name required';
      if (!form.email) err.email = 'Email required';
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) err.email = 'Invalid email';
      if (form.phone && !/^\d{10,15}$/.test(form.phone)) err.phone = 'Phone must be 10-15 digits';
      if (!form.budget) err.budget = 'Budget required';
      else if (isNaN(form.budget)) err.budget = 'Budget must be a number';
    }
    if (step === 1) {
      if (!form.companyName) err.companyName = 'Company name required';
      if (!form.industry) err.industry = 'Industry required';
      if (!form.teamSize) err.teamSize = 'Team size required';
      if (!form.timelineWeeks) err.timelineWeeks = 'Timeline required';
      else if (isNaN(form.timelineWeeks)) err.timelineWeeks = 'Timeline must be a number';
    }
    if (step === 2) {
      if (!form.projectType) err.projectType = 'Project type required';
      if (!form.usersCount) err.usersCount = 'Expected users required';
      else if (isNaN(form.usersCount)) err.usersCount = 'Users must be a number';
      if (!form.features) err.features = 'Key features required';
      if (!form.priority) err.priority = 'Priority required';
      if (!form.delivery) err.delivery = 'Delivery mode required';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => s + 1);
  };
  const handlePrev = () => setStep((s) => s - 1);
  const handleGo = (idx) => setStep(idx);
  const handleFinish = () => {
    if (validateStep()) setFinished(true);
  };
  const handleReset = () => {
    setForm(initialForm);
    setStep(0);
    setErrors({});
    setFinished(false);
  };

  // Stepper progress
  const progressPct = Math.round(((step + 1) / steps.length) * 100);

  return (
    <div>
      <div className="app" id="app">
        <div className="container">
          <header className="topbar">
            <div className="brand">
              <div className="mark" aria-hidden="true">
                <span className="mark__dot" />
                <span className="mark__ring" />
              </div>
              <div className="brand__text">
                <div className="brand__title">Multi-step Form</div>
                <div className="brand__sub">Progress + Validation + Persistence</div>
              </div>
            </div>
            <div className="meta">
              <div className="saved" id="lastSaved" aria-live="polite">Last saved: -</div>
            </div>
          </header>
          <main className="grid">
            <section className="card card--form" aria-label="Multi-step form">
              <div className="card__head">
                <div className="card__titleRow">
                  <h1 className="card__title">Client-ready form flow</h1>
                  <div className="badge" title="Storage enabled">
                    <i className="fa-solid fa-shield-halved" aria-hidden="true" />
                    <span>Saved</span>
                  </div>
                </div>
             
              </div>
              <div className="signature" aria-hidden="true">
                <div className="signature__track" />
                <div className="signature__glow" id="sigGlow" />
              </div>
              <div className="progressWrap" aria-label="Progress">
                <div className="progressTop">
                  <div className="progressLabel">
                    <i className="fa-solid fa-chart-simple" aria-hidden="true" />
                    <span id="progressText">Step {step + 1} of {steps.length}</span>
                  </div>
                  <div className="progressPct" id="progressPct">{progressPct}%</div>
                </div>
                <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPct} aria-label="Form progress">
                  <div className="progress__bar" id="progressBar" style={{ width: progressPct + '%' }} />
                </div>
                <ol className="stepper" id="stepper" aria-label="Steps">
                  {steps.map((label, idx) => (
                    <li className={`step${step === idx ? ' is-active' : ''}`} data-step={idx} key={label}>
                      <button type="button" className="stepBtn" data-go={idx} aria-current={step === idx ? 'step' : undefined} onClick={() => handleGo(idx)}>
                        <span className="stepDot"><i className={[
                          'fa-solid',
                          idx === 0 ? 'fa-user' :
                          idx === 1 ? 'fa-building' :
                          idx === 2 ? 'fa-sliders' :
                          'fa-clipboard-check',
                        ].join(' ')} aria-hidden="true" /></span>
                        <span className="stepText">
                          <span className="stepTitle">{label}</span>
                          <span className="stepHint">{[
                            'Who is this for',
                            'Context and size',
                            'What they need',
                            'Confirm and finish',
                          ][idx]}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
              <form id="msForm" noValidate onSubmit={e => e.preventDefault()}>
                {/* STEP 1 */}
                {step === 0 && (
                  <section className="panel is-active" data-panel={0} aria-label="Step 1 Profile">
                    <div className="panel__grid">
                      <div className="field">
                        <label className="label" htmlFor="fullName">Full name</label>
                        <div className="control">
                          <i className="fa-regular fa-id-badge" aria-hidden="true" />
                          <input id="fullName" name="fullName" type="text" autoComplete="name" placeholder="e.g., Priya Sharma" value={form.fullName} onChange={handleChange} />
                        </div>
                        <div className="help">Enter the contact person's name.</div>
                        <div className="error" id="err_fullName" role="status" aria-live="polite">{errors.fullName}</div>
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="email">Email</label>
                        <div className="control">
                          <i className="fa-regular fa-envelope" aria-hidden="true" />
                          <input id="email" name="email" type="email" autoComplete="email" placeholder="e.g., priya@company.com" inputMode="email" value={form.email} onChange={handleChange} />
                        </div>
                        <div className="help">Used for follow-ups and access links.</div>
                        <div className="error" id="err_email" role="status" aria-live="polite">{errors.email}</div>
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="phone">Phone (optional)</label>
                        <div className="control">
                          <i className="fa-solid fa-phone" aria-hidden="true" />
                          <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="e.g., 9876543210" inputMode="tel" value={form.phone} onChange={handleChange} />
                        </div>
                        <div className="help">Digits only, 10 to 15 is acceptable.</div>
                        <div className="error" id="err_phone" role="status" aria-live="polite">{errors.phone}</div>
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="budget">Estimated budget (USD)</label>
                        <div className="control">
                          <i className="fa-solid fa-dollar-sign" aria-hidden="true" />
                          <input id="budget" name="budget" type="text" placeholder="e.g., 2500" inputMode="numeric" value={form.budget} onChange={handleChange} />
                        </div>
                        <div className="help">Numbers only. Example: 2500</div>
                        <div className="error" id="err_budget" role="status" aria-live="polite">{errors.budget}</div>
                      </div>
                    </div>
                    <div className="nav">
                      <div className="nav__left">
                        <span className="miniNote"><i className="fa-regular fa-circle-check" aria-hidden="true" /> Inline validation, no alerts.</span>
                      </div>
                      <div className="nav__right">
                        <button className="btn btn--primary" type="button" onClick={handleNext}>
                          Next
                          <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </section>
                )}
                {/* STEP 2 */}
                {step === 1 && (
                  <section className="panel is-active" data-panel={1} aria-label="Step 2 Company">
                    <div className="panel__grid">
                      <div className="field">
                        <label className="label" htmlFor="companyName">Company name</label>
                        <div className="control">
                          <i className="fa-solid fa-building-columns" aria-hidden="true" />
                          <input id="companyName" name="companyName" type="text" autoComplete="organization" placeholder="e.g., Orion Tech Labs" value={form.companyName} onChange={handleChange} />
                        </div>
                        <div className="help">The organization requesting the work.</div>
                        <div className="error" id="err_companyName" role="status" aria-live="polite">{errors.companyName}</div>
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="industry">Industry</label>
                        <div className="control control--select">
                          <i className="fa-solid fa-briefcase" aria-hidden="true" />
                          <select id="industry" name="industry" value={form.industry} onChange={handleChange}>
                            <option value="">Select industry</option>
                            <option value="SaaS">SaaS</option>
                            <option value="E-commerce">E-commerce</option>
                            <option value="Education">Education</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Finance">Finance</option>
                            <option value="Logistics">Logistics</option>
                            <option value="Real Estate">Real Estate</option>
                            <option value="Agency">Agency</option>
                            <option value="Other">Other</option>
                          </select>
                          <i className="fa-solid fa-chevron-down caret" aria-hidden="true" />
                        </div>
                        <div className="help">Used to tailor the next step defaults.</div>
                        <div className="error" id="err_industry" role="status" aria-live="polite">{errors.industry}</div>
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="teamSize">Team size</label>
                        <div className="control control--select">
                          <i className="fa-solid fa-users" aria-hidden="true" />
                          <select id="teamSize" name="teamSize" value={form.teamSize} onChange={handleChange}>
                            <option value="">Select size</option>
                            <option value="1-5">1-5</option>
                            <option value="6-25">6-25</option>
                            <option value="26-100">26-100</option>
                            <option value="101-500">101-500</option>
                            <option value="500+">500+</option>
                          </select>
                          <i className="fa-solid fa-chevron-down caret" aria-hidden="true" />
                        </div>
                        <div className="help">This can influence onboarding and roles.</div>
                        <div className="error" id="err_teamSize" role="status" aria-live="polite">{errors.teamSize}</div>
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="timelineWeeks">Timeline (weeks)</label>
                        <div className="control">
                          <i className="fa-regular fa-clock" aria-hidden="true" />
                          <input id="timelineWeeks" name="timelineWeeks" type="text" placeholder="e.g., 6" inputMode="numeric" value={form.timelineWeeks} onChange={handleChange} />
                        </div>
                        <div className="help">Numbers only. Typical range: 2 to 24.</div>
                        <div className="error" id="err_timelineWeeks" role="status" aria-live="polite">{errors.timelineWeeks}</div>
                      </div>
                    </div>
                    <div className="nav">
                      <div className="nav__left">
                        <button className="btn btn--ghost" type="button" onClick={handlePrev}>
                          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
                          Back
                        </button>
                      </div>
                      <div className="nav__right">
                        <button className="btn btn--primary" type="button" onClick={handleNext}>
                          Next
                          <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </section>
                )}
                {/* STEP 3 */}
                {step === 2 && (
                  <section className="panel is-active" data-panel={2} aria-label="Step 3 Preferences">
                    <div className="panel__grid">
                      <div className="field">
                        <label className="label" htmlFor="projectType">Project type</label>
                        <div className="control control--select">
                          <i className="fa-solid fa-layer-group" aria-hidden="true" />
                          <select id="projectType" name="projectType" value={form.projectType} onChange={handleChange}>
                            <option value="">Select type</option>
                            <option value="Landing page">Landing page</option>
                            <option value="Dashboard app">Dashboard app</option>
                            <option value="E-commerce">E-commerce</option>
                            <option value="Booking system">Booking system</option>
                            <option value="Internal tool">Internal tool</option>
                            <option value="UI component work">UI component work</option>
                          </select>
                          <i className="fa-solid fa-chevron-down caret" aria-hidden="true" />
                        </div>
                        <div className="help">Defines the surface area and complexity.</div>
                        <div className="error" id="err_projectType" role="status" aria-live="polite">{errors.projectType}</div>
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="usersCount">Expected users</label>
                        <div className="control">
                          <i className="fa-solid fa-user-group" aria-hidden="true" />
                          <input id="usersCount" name="usersCount" type="text" placeholder="e.g., 1200" inputMode="numeric" value={form.usersCount} onChange={handleChange} />
                        </div>
                        <div className="help">Numbers only. Helps with performance planning.</div>
                        <div className="error" id="err_usersCount" role="status" aria-live="polite">{errors.usersCount}</div>
                      </div>
                      <div className="field field--full">
                        <label className="label" htmlFor="features">Key features</label>
                        <div className="control control--area">
                          <i className="fa-solid fa-list-check" aria-hidden="true" />
                          <textarea id="features" name="features" rows={4} placeholder="e.g., Auth, role access, reports, exports, notifications" value={form.features} onChange={handleChange} />
                        </div>
                        <div className="help">Keep it short. You can refine later.</div>
                        <div className="error" id="err_features" role="status" aria-live="polite">{errors.features}</div>
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="priority">Priority</label>
                        <div className="control control--select">
                          <i className="fa-solid fa-bolt" aria-hidden="true" />
                          <select id="priority" name="priority" value={form.priority} onChange={handleChange}>
                            <option value="">Select priority</option>
                            <option value="Speed">Speed</option>
                            <option value="Polish">Polish</option>
                            <option value="Cost">Cost</option>
                            <option value="Scalability">Scalability</option>
                          </select>
                          <i className="fa-solid fa-chevron-down caret" aria-hidden="true" />
                        </div>
                        <div className="help">What matters most right now.</div>
                        <div className="error" id="err_priority" role="status" aria-live="polite">{errors.priority}</div>
                      </div>
                      <div className="field">
                        <label className="label" htmlFor="delivery">Delivery mode</label>
                        <div className="control control--select">
                          <i className="fa-solid fa-truck-fast" aria-hidden="true" />
                          <select id="delivery" name="delivery" value={form.delivery} onChange={handleChange}>
                            <option value="">Select delivery</option>
                            <option value="Fixed scope">Fixed scope</option>
                            <option value="Milestones">Milestones</option>
                            <option value="Weekly sprints">Weekly sprints</option>
                            <option value="Hourly support">Hourly support</option>
                          </select>
                          <i className="fa-solid fa-chevron-down caret" aria-hidden="true" />
                        </div>
                        <div className="help">How the work will be executed.</div>
                        <div className="error" id="err_delivery" role="status" aria-live="polite">{errors.delivery}</div>
                      </div>
                    </div>
                    <div className="nav">
                      <div className="nav__left">
                        <button className="btn btn--ghost" type="button" onClick={handlePrev}>
                          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
                          Back
                        </button>
                      </div>
                      <div className="nav__right">
                        <button className="btn btn--primary" type="button" onClick={handleNext}>
                          Next
                          <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </section>
                )}
                {/* STEP 4 */}
                {step === 3 && (
                  <section className="panel is-active" data-panel={3} aria-label="Step 4 Review and finish">
                    <div className="review">
                      <div className="review__head">
                        <div className="review__title">
                          <i className="fa-solid fa-clipboard-check" aria-hidden="true" />
                          <span>Review</span>
                        </div>
                        <div className="review__hint">Confirm details before finishing.</div>
                      </div>
                      <div className="review__grid" id="reviewGrid" aria-live="polite">
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                          {Object.entries(form).map(([k, v]) => (
                            <li key={k}><b>{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}:</b> {v || <span style={{ color: '#aaa' }}>-</span>}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="nav nav--tight">
                        <div className="nav__left">
                          <button className="btn btn--ghost" type="button" onClick={handlePrev}>
                            <i className="fa-solid fa-arrow-left" aria-hidden="true" />
                            Back
                          </button>
                        </div>
                        <div className="nav__right">
                          <button className="btn btn--primary" id="btnFinish" type="button" onClick={handleFinish}>
                            Finish
                            <i className="fa-solid fa-check" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      {finished && (
                        <div className="done" id="doneBanner" aria-live="polite">
                          <div className="done__icon"><i className="fa-solid fa-circle-check" aria-hidden="true" /></div>
                          <div className="done__text">
                            <div className="done__title">Saved and ready</div>
                            <div className="done__sub">You can reload and continue anytime.</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </form>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Stats;
