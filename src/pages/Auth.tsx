import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  IconCheck, IconMail, IconLock, IconEye, IconEyeOff, IconUser, IconPhone, IconBuilding, IconMapPin, IconClock, IconTruck,
  IconBuildingStore, IconArrowRight, IconArrowLeft, IconInfoCircle, IconFile, IconUpload, IconX, IconShieldCheck, IconHelpCircle,
  IconLockExclamation, IconCircleCheck, IconHourglass, IconPlus, IconBuildingBank,
} from '@tabler/icons-react';
import { useStore } from '../store/store';
import { DEMO_CODE, Field, Modal } from '../components/ui';
import { emptyApplication } from '../data/seed';

const BRAND = [
  { photo: 'images/excavator-sunset.jpg', head: 'Rent out your equipment to Atlanta’s contractors', sub: 'List your machines, get booked online and get paid on time. All in one place.' },
  { photo: 'images/road-roller.jpg', head: 'Set up your supplier account in minutes', sub: 'Your account is home for your fleet, bookings, team and payouts. You will be the admin.' },
  { photo: 'images/pipelayers.jpg', head: 'One quick check to keep RigSetGo safe', sub: 'Every supplier confirms their email before anything goes live. It only takes a moment.' },
  { photo: 'images/wheel-loaders.jpg', head: 'Tell contractors who they are renting from', sub: 'Your business name and details appear on every listing, quote and invoice.' },
  { photo: 'images/dump-truck.jpg', head: 'Get verified. Get trusted.', sub: 'Verified suppliers get a badge on their storefront, so contractors book with confidence.' },
  { photo: 'images/excavator-dusk.jpg', head: 'Get paid straight to your bank', sub: 'Payouts are sent by Stripe, PayPal or Square. RigSetGo never stores your full bank details.' },
  { photo: 'images/excavator-sky.jpg', head: 'Almost there', sub: 'Check your details once more, then send your application to our team.' },
  { photo: 'images/excavator-sunset.jpg', head: 'We’re checking your application', sub: 'Most suppliers are approved within 1 to 2 business days.' },
  { photo: 'images/pipelayers.jpg', head: 'Your account, kept safe', sub: 'We ask for a security code at every sign-in, so only your team can open your bookings and payouts.' },
];

function Shell({ brand, top, children, dots }: { brand: number; top: ReactNode; children: ReactNode; dots?: number }) {
  const b = BRAND[brand];
  return (
    <div className="auth">
      <aside className="auth-brand">
        <img className="logo" src="images/logo-white.svg" alt="RigSetGo" />
        <div className="auth-photo">
          <img src={b.photo} alt="Construction equipment on a job site" />
        </div>
        <div>
          <h2>{b.head}</h2>
          <p>{b.sub}</p>
          {brand === 0 && (
            <div className="auth-points">
              {['Verified suppliers only', 'Secure payouts with Stripe, PayPal or Square', 'Live delivery tracking for every rental'].map((t) => (
                <div key={t}>
                  <IconCheck size={20} stroke={3} /> {t}
                </div>
              ))}
            </div>
          )}
          {dots !== undefined && (
            <div className="dots">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <i key={i} className={i === dots ? 'on' : ''} />
              ))}
            </div>
          )}
        </div>
      </aside>
      <section className="auth-form">
        <div className="auth-top">{top}</div>
        <div className="auth-content">{children}</div>
        <div className="auth-foot">
          <span>© 2026 RigSetGo</span>
          <span>Privacy</span>
          <span>Terms</span>
        </div>
      </section>
    </div>
  );
}

const helpTop = (
  <>
    <span />
    <span className="row gap-8">
      <IconHelpCircle size={18} /> Need help? <a href="mailto:support@rigsetgo.com">Contact support</a>
    </span>
  </>
);

/* ---------------- Sign in ---------------- */
export function Login() {
  const { auth, setAuth, toast } = useStore();
  const nav = useNavigate();
  const [email, setEmail] = useState(auth.email || 'mark@atlantaheavyrentals.com');
  const [pw, setPw] = useState('demo-password');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [forgot, setForgot] = useState(false);
  if (auth.signedIn) return <Navigate to="/" replace />;
  if (auth.locked) return <Navigate to="/login/locked" replace />;
  const submit = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email address.');
    if (!pw) return setErr('Enter your password.');
    setAuth({ email, codeStep: true });
    nav('/login/code');
  };
  return (
    <Shell
      brand={0}
      top={
        <>
          <span />
          <span>
            New to RigSetGo? <Link to="/signup" className="strong">Create a supplier account</Link>
          </span>
        </>
      }
    >
      <h1>Sign in</h1>
      <p className="lead">Welcome back. Sign in to manage your equipment, bookings and payouts.</p>
      <form
        className="col gap-16"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field label="Email" error={err && err.includes('email') ? err : ''}>
          <div className="input-wrap">
            <IconMail size={18} />
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
        </Field>
        <Field label="Password" error={err && err.includes('password') ? err : ''}>
          <div className="input-wrap">
            <IconLock size={18} />
            <input className="input" type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
            <button type="button" className="suffix" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            </button>
          </div>
        </Field>
        <div className="row between">
          <label className="check">
            <input type="checkbox" defaultChecked /> Keep me signed in
          </label>
          <button type="button" className="link" onClick={() => setForgot(true)}>
            Forgot password?
          </button>
        </div>
        <button className="btn btn-primary btn-lg btn-block" type="submit">
          Continue <IconArrowRight size={18} />
        </button>
      </form>
      <div className="banner info small">
        <IconInfoCircle size={18} />
        <div className="grow">Demo: any email and password work. The security code on the next screen is 482193.</div>
      </div>
      {forgot && (
        <Modal
          title="Reset your password"
          sub="We will email you a link to choose a new password."
          onClose={() => setForgot(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setForgot(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setForgot(false);
                  toast(`Reset link sent to ${email}`);
                }}
              >
                Send reset link
              </button>
            </>
          }
        >
          <Field label="Email">
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        </Modal>
      )}
    </Shell>
  );
}

export function SecurityCode() {
  const { auth, setAuth, toast } = useStore();
  const nav = useNavigate();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [err, setErr] = useState('');
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  if (auth.signedIn) return <Navigate to="/" replace />;
  if (auth.locked) return <Navigate to="/login/locked" replace />;
  if (!auth.codeStep) return <Navigate to="/login" replace />;
  const verify = (code: string) => {
    if (code === DEMO_CODE) {
      setAuth({ signedIn: true, codeStep: false, wrongCodes: 0, tourOpen: !auth.tourDone });
      nav('/');
      return;
    }
    const n = auth.wrongCodes + 1;
    if (n >= 3) {
      setAuth({ wrongCodes: n, locked: true, codeStep: false });
      nav('/login/locked');
      return;
    }
    setAuth({ wrongCodes: n });
    setErr(`That code is not right. ${3 - n} ${3 - n === 1 ? 'try' : 'tries'} left before the account locks.`);
    setDigits(['', '', '', '', '', '']);
    refs.current[0]?.focus();
  };
  const setAt = (i: number, v: string) => {
    const clean = v.replace(/\D/g, '');
    if (clean.length > 1) {
      const all = clean.slice(0, 6).split('');
      const next = [...digits];
      all.forEach((d, k) => (next[k] = d));
      setDigits(next);
      if (next.every(Boolean)) verify(next.join(''));
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    setErr('');
    if (clean && i < 5) refs.current[i + 1]?.focus();
    if (next.every(Boolean)) verify(next.join(''));
  };
  return (
    <Shell
      brand={8}
      top={
        <>
          <Link to="/login" className="back" onClick={() => setAuth({ codeStep: false })}>
            <IconArrowLeft size={16} /> Back to sign in
          </Link>
          <span />
        </>
      }
    >
      <div className="icon-circle" style={{ width: 88, height: 88 }}>
        <IconShieldCheck size={40} />
      </div>
      <h1>Enter your security code</h1>
      <p className="lead">We sent a 6-digit code to the phone ending in 0142. This keeps your bookings and payouts safe.</p>
      <div className={`code-inputs ${err ? 'invalid' : ''}`}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            maxLength={6}
            aria-label={`Digit ${i + 1}`}
            autoFocus={i === 0}
            onChange={(e) => setAt(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
              if (e.key === 'Enter' && digits.every(Boolean)) verify(digits.join(''));
            }}
          />
        ))}
      </div>
      {err && <div className="banner danger small">{err}</div>}
      <button className="btn btn-primary btn-lg btn-block" disabled={!digits.every(Boolean)} onClick={() => verify(digits.join(''))}>
        Verify and sign in
      </button>
      <div className="row between small">
        <span className="muted">Didn’t get it?</span>
        <button className="link" onClick={() => toast('A new code was sent to your phone', 'info')}>
          Send a new code
        </button>
      </div>
      <div className="banner info small">
        <IconInfoCircle size={18} />
        <div className="grow">Demo code: 482193. Three wrong codes lock the account.</div>
      </div>
    </Shell>
  );
}

export function Locked() {
  const { auth, setAuth, toast } = useStore();
  const nav = useNavigate();
  const [sent, setSent] = useState(false);
  if (!auth.locked) return <Navigate to="/login" replace />;
  return (
    <Shell brand={8} top={helpTop}>
      <div className="icon-circle red" style={{ width: 88, height: 88 }}>
        <IconLockExclamation size={40} />
      </div>
      <h1>Your account is locked</h1>
      <p className="lead">The security code was entered wrong 3 times, so we locked the account to keep it safe. Nobody can sign in until it is unlocked.</p>
      <div className="doc-row">
        <div className="strong">How to unlock</div>
        <div className="muted small">We will email an unlock link to {auth.email || 'your email'}. Open it on any device, then sign in again.</div>
      </div>
      {!sent ? (
        <button
          className="btn btn-primary btn-lg btn-block"
          onClick={() => {
            setSent(true);
            toast('Unlock link sent to your email', 'info');
          }}
        >
          <IconMail size={18} /> Email me an unlock link
        </button>
      ) : (
        <>
          <div className="banner success small">
            <IconCircleCheck size={18} />
            <div className="grow">Unlock link sent. Check your inbox.</div>
          </div>
          <button
            className="btn btn-primary btn-lg btn-block"
            onClick={() => {
              setAuth({ locked: false, wrongCodes: 0, codeStep: false });
              toast('Account unlocked. Please sign in again.');
              nav('/login');
            }}
          >
            I opened the unlock link (demo)
          </button>
        </>
      )}
    </Shell>
  );
}

/* ---------------- Supplier sign-up ---------------- */
const STEPS = ['Account', 'Verify email', 'Business', 'Documents', 'Payout', 'Review'];

function Stepper({ cur }: { cur: number }) {
  return (
    <div className="stepper" aria-label={`Step ${cur} of 6`}>
      {STEPS.map((s, i) => {
        const n = i + 1;
        const cls = n < cur ? 'done' : n === cur ? 'now' : '';
        return (
          <div key={s} className={`s ${cls}`}>
            <div className="line">
              <i className={i === 0 ? 'hide' : n <= cur ? 'on' : ''} />
              <span className="c">{n < cur ? <IconCheck size={14} stroke={3} /> : n}</span>
              <i className={i === 5 ? 'hide' : n < cur ? 'on' : ''} />
            </div>
            {s}
          </div>
        );
      })}
    </div>
  );
}

export function Signup() {
  const { state, update, setAuth, toast } = useStore();
  const nav = useNavigate();
  const a = state.application;
  const set = (patch: Partial<typeof a>) => update((s) => Object.assign(s.application, patch));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [terms, setTerms] = useState(false);
  const [timer, setTimer] = useState(45);
  const [newArea, setNewArea] = useState('');
  const [connecting, setConnecting] = useState<'' | 'Stripe' | 'PayPal' | 'Square'>('');

  useEffect(() => {
    // Opening sign-up after a finished application starts a fresh one.
    if (a.status === 'Approved') update((s) => (s.application = emptyApplication()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (a.step !== 2) return;
    setTimer(45);
    const t = setInterval(() => setTimer((x) => (x > 0 ? x - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [a.step]);

  useEffect(() => {
    const keys = Object.entries(a.docs).filter(([, v]) => v === 'uploading').map(([k]) => k);
    if (!keys.length) return;
    const t = setTimeout(() => update((s) => keys.forEach((k) => (s.application.docs[k] = 'uploaded'))), 1400);
    return () => clearTimeout(t);
  }, [a.docs, update]);

  const go = (step: number) => {
    setErrors({});
    set({ step });
    window.scrollTo(0, 0);
  };

  const top =
    a.step <= 1 ? (
      <>
        {a.step === 1 ? <span className="strong" style={{ color: 'var(--navy)' }}>Step 1 of 6</span> : <span />}
        <span>
          Already have an account? <Link to="/login" className="strong">Log in</Link>
        </span>
      </>
    ) : a.step <= 6 ? (
      <>
        <span className="strong" style={{ color: 'var(--navy)' }}>Step {a.step} of 6</span>
        <span className="row gap-8">
          <IconHelpCircle size={18} /> Need help? <a href="mailto:support@rigsetgo.com">Contact support</a>
        </span>
      </>
    ) : (
      helpTop
    );

  const back = (to: number) => (
    <button className="btn btn-secondary btn-lg grow" onClick={() => go(to)}>
      <IconArrowLeft size={18} /> Back
    </button>
  );

  let body: ReactNode = null;

  if (a.step === 0) {
    body = (
      <>
        <span className="chip" style={{ alignSelf: 'flex-start' }}>
          <IconBuildingStore size={14} /> Welcome
        </span>
        <h1>Welcome to RigSetGo</h1>
        <p className="lead">Tell us how you will use RigSetGo. You can add the other side later from your settings.</p>
        {[
          { v: 'supplier' as const, icon: IconBuildingStore, t: 'I rent out equipment', d: 'List your machines, take bookings and get paid.' },
          { v: 'contractor' as const, icon: IconTruck, t: 'I need equipment', d: 'Find, book and track rentals for your jobsites.' },
        ].map((o) => (
          <button key={o.v} className={`option ${a.role === o.v ? 'selected' : ''}`} onClick={() => set({ role: o.v })}>
            <span className="icon-circle" style={{ width: 52, height: 52, background: a.role === o.v ? 'var(--navy)' : undefined, color: a.role === o.v ? '#fff' : undefined }}>
              <o.icon size={24} />
            </span>
            <span className="grow">
              <div className="strong" style={{ fontSize: 17 }}>{o.t}</div>
              <div className="muted small">{o.d}</div>
            </span>
            <input type="radio" readOnly checked={a.role === o.v} aria-label={o.t} />
          </button>
        ))}
        {a.role === 'contractor' ? (
          <div className="banner warning small">
            <IconInfoCircle size={18} />
            <div className="grow">
              <b>Contractor accounts use the contractor portal.</b>This demo is the supplier portal. Choose “I rent out equipment” to continue.
            </div>
          </div>
        ) : (
          <button className="btn btn-primary btn-lg btn-block" onClick={() => go(1)}>
            Continue as a supplier <IconArrowRight size={18} />
          </button>
        )}
        <div className="banner info small">
          <IconInfoCircle size={18} />
          <div className="grow">Supplier accounts are checked by our team before equipment goes live.</div>
        </div>
      </>
    );
  }

  if (a.step === 1) {
    const strength = Math.min(4, (pw.length >= 8 ? 1 : 0) + (/[A-Z]/.test(pw) ? 1 : 0) + (/\d/.test(pw) ? 1 : 0) + (/[^A-Za-z0-9]/.test(pw) ? 1 : 0));
    const label = ['Too short', 'Weak password', 'Fair password', 'Good password', 'Strong password'][strength];
    const submit = () => {
      const e: Record<string, string> = {};
      if (a.name.trim().length < 2) e.name = 'Enter your full name.';
      if (!/^\S+@\S+\.\S+$/.test(a.email)) e.email = 'Enter a valid business email.';
      if (a.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a 10-digit phone number.';
      if (strength < 3) e.pw = 'Use 8 or more characters with a capital letter and a number.';
      if (!terms) e.terms = 'Please agree to the terms to continue.';
      setErrors(e);
      if (!Object.keys(e).length) {
        go(2);
        toast(`Confirmation link sent to ${a.email}`, 'info');
      }
    };
    body = (
      <>
        <Stepper cur={1} />
        <h1>Create your account</h1>
        <p className="lead">You will be the admin of your company’s supplier account.</p>
        <Field label="Full name" error={errors.name}>
          <div className="input-wrap">
            <IconUser size={18} />
            <input className={`input ${errors.name ? 'invalid' : ''}`} value={a.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Mark Rivera" />
          </div>
        </Field>
        <div className="grid g2" style={{ gap: 16 }}>
          <Field label="Business email" error={errors.email}>
            <div className="input-wrap">
              <IconMail size={18} />
              <input className={`input ${errors.email ? 'invalid' : ''}`} value={a.email} onChange={(e) => set({ email: e.target.value })} placeholder="you@company.com" />
            </div>
          </Field>
          <Field label="Phone number" error={errors.phone}>
            <div className="input-wrap">
              <IconPhone size={18} />
              <input className={`input ${errors.phone ? 'invalid' : ''}`} value={a.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="(404) 555-0142" />
            </div>
          </Field>
        </div>
        <Field label="Password" error={errors.pw}>
          <div className="input-wrap">
            <IconLock size={18} />
            <input className={`input ${errors.pw ? 'invalid' : ''}`} type={showPw ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" />
            <button type="button" className="suffix" onClick={() => setShowPw(!showPw)} aria-label="Show password">
              {showPw ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            </button>
          </div>
          {pw && (
            <div className="row gap-8">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} style={{ width: 48, height: 4, borderRadius: 2, background: i < strength ? (strength >= 3 ? 'var(--success)' : 'var(--orange)') : 'var(--line)' }} />
              ))}
              <span className="tiny strong" style={{ color: strength >= 3 ? 'var(--success)' : 'var(--orange-ink)' }}>
                {label}
              </span>
            </div>
          )}
        </Field>
        <div className="col gap-4">
          <label className="check">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
            <span>
              I agree to the <a href="#/signup">Terms of Service</a> and <a href="#/signup">Privacy Policy</a>
            </span>
          </label>
          {errors.terms && <span className="error tiny" style={{ color: 'var(--danger)' }}>{errors.terms}</span>}
        </div>
        <div className="row">
          {back(0)}
          <button className="btn btn-primary btn-lg grow" onClick={submit}>
            Create account <IconArrowRight size={18} />
          </button>
        </div>
      </>
    );
  }

  if (a.step === 2) {
    body = (
      <>
        <Stepper cur={2} />
        <div className="icon-circle" style={{ width: 96, height: 96 }}>
          <IconMail size={44} />
        </div>
        <h1>Check your email</h1>
        <p className="lead">
          We sent a confirmation link to <b>{a.email}</b>. Click the link in that email to continue.
        </p>
        <div className="doc-row">
          <div className="row">
            <span className="icon-circle orange">
              <IconClock size={20} />
            </span>
            <div>
              <div className="strong">Waiting for confirmation</div>
              <div className="muted small">This page moves on by itself once you click the link.</div>
            </div>
          </div>
        </div>
        <div className="row">
          <button
            className="btn btn-primary btn-lg grow"
            onClick={() => {
              toast('Email confirmed');
              go(3);
            }}
          >
            <IconMail size={18} /> I clicked the link (demo)
          </button>
          <button
            className="btn btn-secondary btn-lg grow"
            disabled={timer > 0}
            onClick={() => {
              setTimer(45);
              toast('A new link was sent', 'info');
            }}
          >
            {timer > 0 ? `Resend link in 0:${String(timer).padStart(2, '0')}` : 'Resend link'}
          </button>
        </div>
        <div className="row gap-8 small">
          <span className="muted">Wrong email?</span>
          <button className="link" onClick={() => go(1)}>
            Change it
          </button>
        </div>
      </>
    );
  }

  if (a.step === 3) {
    const submit = () => {
      const e: Record<string, string> = {};
      if (a.legalName.trim().length < 3) e.legalName = 'Enter your legal business name.';
      if (a.contactName.trim().length < 2) e.contactName = 'Enter a contact name.';
      if (a.address.trim().length < 8) e.address = 'Enter your business address.';
      if (!a.serviceAreas.length) e.areas = 'Add at least one service area.';
      if (!a.delivery && !a.pickup) e.fulfil = 'Choose at least one way contractors get equipment.';
      setErrors(e);
      if (!Object.keys(e).length) go(4);
    };
    body = (
      <>
        <Stepper cur={3} />
        <h1>Business details</h1>
        <p className="lead">This information appears on your storefront, quotes and invoices.</p>
        <div className="grid g2" style={{ gap: 16 }}>
          <Field label="Legal business name" error={errors.legalName}>
            <div className="input-wrap">
              <IconBuilding size={18} />
              <input className={`input ${errors.legalName ? 'invalid' : ''}`} value={a.legalName} onChange={(e) => set({ legalName: e.target.value })} placeholder="Atlanta Heavy Rentals LLC" />
            </div>
          </Field>
          <Field label="Public contact name" error={errors.contactName}>
            <div className="input-wrap">
              <IconUser size={18} />
              <input className={`input ${errors.contactName ? 'invalid' : ''}`} value={a.contactName || a.name} onChange={(e) => set({ contactName: e.target.value })} onFocus={() => !a.contactName && set({ contactName: a.name })} />
            </div>
          </Field>
        </div>
        <Field label="Business address" error={errors.address} hint="If the address search does not find it, just type it in full.">
          <div className="input-wrap">
            <IconMapPin size={18} />
            <input className={`input ${errors.address ? 'invalid' : ''}`} value={a.address} onChange={(e) => set({ address: e.target.value })} placeholder="2150 Marietta Blvd NW, Atlanta, GA 30318" />
          </div>
        </Field>
        <Field label="Service areas" error={errors.areas}>
          <div className="row wrap gap-8" style={{ border: '1px solid var(--line-strong)', borderRadius: 12, padding: '10px 12px' }}>
            {a.serviceAreas.map((x) => (
              <span key={x} className="chip">
                {x}
                <button aria-label={`Remove ${x}`} onClick={() => set({ serviceAreas: a.serviceAreas.filter((y) => y !== x) })}>
                  <IconX size={14} />
                </button>
              </span>
            ))}
            <input
              style={{ border: 'none', outline: 'none', flex: 1, minWidth: 140, padding: 6 }}
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              placeholder="+ Add area and press Enter"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newArea.trim()) {
                  set({ serviceAreas: [...a.serviceAreas, newArea.trim()] });
                  setNewArea('');
                }
              }}
            />
          </div>
        </Field>
        <div className="grid g3" style={{ gap: 16 }}>
          <Field label="Working days">
            <select className="select" value={a.days} onChange={(e) => set({ days: e.target.value })}>
              {['Mon – Fri', 'Mon – Sat', 'Every day'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Opens">
            <select className="select" value={a.opens} onChange={(e) => set({ opens: e.target.value })}>
              {['6:00 AM', '7:00 AM', '8:00 AM'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Closes">
            <select className="select" value={a.closes} onChange={(e) => set({ closes: e.target.value })}>
              {['5:00 PM', '6:00 PM', '7:00 PM'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="How contractors get the equipment" error={errors.fulfil}>
          <div className="grid g2" style={{ gap: 16 }}>
            {[
              { k: 'delivery' as const, t: 'Delivery to jobsite', d: 'Your team delivers', icon: IconTruck },
              { k: 'pickup' as const, t: 'Customer pickup', d: 'From your yard', icon: IconBuilding },
            ].map((o) => (
              <label key={o.k} className={`option ${a[o.k] ? 'selected' : ''}`}>
                <input type="checkbox" checked={a[o.k]} onChange={(e) => set({ [o.k]: e.target.checked })} />
                <span className="grow">
                  <div className="strong">{o.t}</div>
                  <div className="tiny muted">{o.d}</div>
                </span>
                <o.icon size={20} color="var(--navy)" />
              </label>
            ))}
          </div>
        </Field>
        <div className="row">
          {back(2)}
          <button className="btn btn-primary btn-lg grow" onClick={submit}>
            Save and continue <IconArrowRight size={18} />
          </button>
        </div>
      </>
    );
  }

  if (a.step === 4) {
    const allDone = Object.values(a.docs).every((v) => v === 'uploaded');
    body = (
      <>
        <Stepper cur={4} />
        <h1>Verification documents</h1>
        <p className="lead">Upload these so our team can verify your business. Your documents stay private.</p>
        {a.status === 'Needs information' && a.infoRequest && (
          <div className="banner warning small">
            <IconInfoCircle size={18} />
            <div className="grow">
              <b>Our team asked for more information</b>
              {a.infoRequest}
            </div>
          </div>
        )}
        {Object.entries(a.docs).map(([name, st]) =>
          st === 'empty' ? (
            <button key={name} className="dropzone" onClick={() => update((s) => (s.application.docs[name] = 'uploading'))}>
              <span className="icon-circle" style={{ background: '#fff' }}>
                <IconUpload size={20} />
              </span>
              <span>
                <b>{name}:</b> <span className="muted">drag your file here or</span> <u style={{ color: 'var(--navy)' }}>browse</u>
              </span>
              <span className="tiny muted">PDF, JPG or PNG · up to 10 MB</span>
            </button>
          ) : (
            <div key={name} className="doc-row">
              <div className="row">
                <span className="icon-circle">
                  <IconFile size={20} />
                </span>
                <div className="grow">
                  <div className="strong">{name}</div>
                  <div className="tiny muted">{name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf · {st === 'uploading' ? 'Uploading…' : '1.2 MB'}</div>
                </div>
                {st === 'uploaded' && (
                  <span className="badge b-green">
                    <IconCheck size={12} stroke={3} /> Uploaded
                  </span>
                )}
                <button className="x-btn" aria-label={`Remove ${name}`} onClick={() => update((s) => (s.application.docs[name] = 'empty'))}>
                  <IconX size={18} />
                </button>
              </div>
              {st === 'uploading' && (
                <div className="progress">
                  <div style={{ width: '64%' }} />
                </div>
              )}
            </div>
          ),
        )}
        <div className="banner info small">
          <IconShieldCheck size={18} />
          <div className="grow">Only the RigSetGo team can see these documents. Review usually takes 1 to 2 business days.</div>
        </div>
        {errors.docs && <div className="banner danger small">{errors.docs}</div>}
        <div className="row">
          {back(3)}
          <button
            className="btn btn-primary btn-lg grow"
            onClick={() => (allDone ? go(5) : setErrors({ docs: 'Please upload all three documents to continue.' }))}
          >
            Continue to payout <IconArrowRight size={18} />
          </button>
        </div>
      </>
    );
  }

  if (a.step === 5) {
    body = (
      <>
        <Stepper cur={5} />
        <h1>Payout account</h1>
        <p className="lead">Choose how you want to receive your money. You will type your bank details on the provider’s own secure page.</p>
        {(['Stripe', 'PayPal', 'Square'] as const).map((p) => (
          <button key={p} className={`option ${a.provider === p ? 'selected' : ''}`} onClick={() => setConnecting(p)}>
            <span className="icon-circle" style={{ width: 48, height: 48 }}>
              <IconBuildingBank size={22} />
            </span>
            <span className="grow">
              <div className="strong">{p}</div>
              <div className="tiny muted">{a.provider === p ? 'Connected · Truist Bank •••• 4417' : 'Payouts to your US bank account in 2 business days'}</div>
            </span>
            {a.provider === p ? <span className="badge b-green">Connected</span> : <span className="btn btn-secondary btn-sm">Connect</span>}
          </button>
        ))}
        <div className="banner info small">
          <IconLock size={18} />
          <div className="grow">RigSetGo never stores your full bank or card numbers.</div>
        </div>
        {errors.payout && <div className="banner danger small">{errors.payout}</div>}
        <div className="row">
          {back(4)}
          <button className="btn btn-primary btn-lg grow" onClick={() => (a.provider ? go(6) : setErrors({ payout: 'Connect one payout account to continue.' }))}>
            Continue to review <IconArrowRight size={18} />
          </button>
        </div>
        {connecting && (
          <Modal
            title={`Connect ${connecting}`}
            sub={`You are now on ${connecting}’s secure page (demo).`}
            onClose={() => setConnecting('')}
            footer={
              <>
                <button className="btn btn-secondary" onClick={() => setConnecting('')}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    set({ provider: connecting });
                    setConnecting('');
                    toast(`${connecting} connected`);
                  }}
                >
                  Connect account
                </button>
              </>
            }
          >
            <Field label="Bank">
              <input className="input" defaultValue="Truist Bank" />
            </Field>
            <div className="grid g2" style={{ gap: 16 }}>
              <Field label="Routing number">
                <input className="input" defaultValue="061000104" />
              </Field>
              <Field label="Account number">
                <input className="input" defaultValue="••••••4417" />
              </Field>
            </div>
          </Modal>
        )}
      </>
    );
  }

  if (a.step === 6) {
    const rows: [string, string, number][] = [
      ['Account', `${a.name} · ${a.email} · ${a.phone}`, 1],
      ['Business', `${a.legalName}, ${a.address}`, 3],
      ['Service areas', a.serviceAreas.join(', '), 3],
      ['Hours', `${a.days}, ${a.opens} – ${a.closes}`, 3],
      ['Fulfillment', [a.delivery && 'Delivery to jobsite', a.pickup && 'Customer pickup'].filter(Boolean).join(' and '), 3],
      ['Documents', `${Object.keys(a.docs).length} documents uploaded`, 4],
      ['Payout account', `${a.provider} · •••• 4417`, 5],
    ];
    body = (
      <>
        <Stepper cur={6} />
        <h1>Review and submit</h1>
        <p className="lead">Check your details. You can still change anything before you send it.</p>
        <div className="card flat">
          {rows.map(([k, v, step], i) => (
            <div key={k} className="row between" style={{ padding: '14px 18px', borderTop: i ? '1px solid var(--line)' : 'none' }}>
              <div className="grow">
                <div className="tiny muted">{k}</div>
                <div className="strong small">{v}</div>
              </div>
              <button className="link" onClick={() => go(step)}>
                Edit
              </button>
            </div>
          ))}
        </div>
        <div className="row">
          {back(5)}
          <button
            className="btn btn-primary btn-lg grow"
            onClick={() => {
              set({ status: 'Pending', step: 7, infoRequest: undefined });
              toast('Application sent to RigSetGo');
            }}
          >
            Submit application <IconArrowRight size={18} />
          </button>
        </div>
      </>
    );
  }

  if (a.step >= 7) {
    body =
      a.status === 'Approved' ? (
        <>
          <div className="icon-circle green" style={{ width: 96, height: 96 }}>
            <IconCircleCheck size={48} />
          </div>
          <h1>You’re verified!</h1>
          <p className="lead">Your business is approved. A verified badge now shows on your storefront. Next, add your first machine.</p>
          <button
            className="btn btn-primary btn-lg btn-block"
            onClick={() => {
              setAuth({ signedIn: true, codeStep: false, email: a.email || 'mark@atlantaheavyrentals.com', tourOpen: true });
              nav('/');
            }}
          >
            Go to your dashboard <IconArrowRight size={18} />
          </button>
        </>
      ) : (
        <>
          <div className="icon-circle orange" style={{ width: 96, height: 96 }}>
            <IconHourglass size={44} />
          </div>
          <h1>Application under review</h1>
          <p className="lead">Thank you{a.name ? `, ${a.name.split(' ')[0]}` : ''}. Our team is checking your business and documents. We will email you as soon as it is done.</p>
          <div className="timeline">
            {[
              ['Application sent', true],
              ['RigSetGo Compliance team checks your documents', false],
              ['You get a verified badge and can list equipment', false],
            ].map(([t, done]) => (
              <div className="t" key={String(t)}>
                <i style={{ background: done ? 'var(--navy)' : 'var(--line-strong)' }} />
                <div className={done ? 'strong' : 'muted'}>{t}</div>
              </div>
            ))}
          </div>
          <div className="doc-row">
            <div className="strong small">Demo: choose what the RigSetGo team decides</div>
            <div className="row">
              <button
                className="btn btn-primary grow"
                onClick={() =>
                  update(
                    (s) => {
                      s.application.status = 'Approved';
                    },
                    { toast: 'Application approved' },
                  )
                }
              >
                <IconCheck size={18} /> Approve
              </button>
              <button
                className="btn btn-secondary grow"
                onClick={() =>
                  update(
                    (s) => {
                      s.application.status = 'Needs information';
                      s.application.infoRequest = 'The insurance certificate is not readable. Please upload a clearer copy.';
                      s.application.docs['Certificate of insurance'] = 'empty';
                      s.application.step = 4;
                    },
                    { toast: 'RigSetGo asked for more information', tone: 'warning' },
                  )
                }
              >
                <IconPlus size={18} /> Ask for more info
              </button>
            </div>
          </div>
        </>
      );
  }

  return (
    <Shell brand={Math.min(a.step, 7)} top={top} dots={a.step <= 6 ? a.step : undefined}>
      {body}
    </Shell>
  );
}
