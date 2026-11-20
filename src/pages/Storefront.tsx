import { useState } from 'react';
import { IconRosetteDiscountCheck, IconMapPin, IconClock, IconTruck, IconBuilding, IconX, IconInfoCircle, IconHourglass, IconStar } from '@tabler/icons-react';
import { useStore } from '../store/store';
import { Field, Stars } from '../components/ui';
import type { Business } from '../data/types';
import { fmtDate } from '../data/utils';
import { img } from '../data/images';

const SENSITIVE: { key: keyof Business; label: string }[] = [
  { key: 'legalName', label: 'Business name' },
  { key: 'phone', label: 'Public phone' },
  { key: 'email', label: 'Public email' },
];

export default function Storefront() {
  const { state, update } = useStore();
  const biz = state.business;
  const [f, setF] = useState<Business>(biz);
  const [area, setArea] = useState('');
  const [err, setErr] = useState('');
  const published = state.equipment.filter((e) => e.status === 'Published');
  const reviews = state.reviews.filter((r) => r.report?.status !== 'Removed');
  const rating = reviews.reduce((s, r) => s + (r.accuracy + r.delivery + r.service) / 3, 0) / Math.max(1, reviews.length);
  const dirty = JSON.stringify({ ...f, pendingChange: undefined }) !== JSON.stringify({ ...biz, pendingChange: undefined });

  const save = () => {
    if (f.about.trim().length < 20) return setErr('Write at least one sentence about your business.');
    if (!f.serviceAreas.length) return setErr('Add at least one service area.');
    if (!f.delivery && !f.pickup) return setErr('Choose at least one way contractors get equipment.');
    if (f.rentalPolicy.trim().length < 20 || f.cancellationPolicy.trim().length < 20) return setErr('Both policies are needed. Contractors see them before paying.');
    setErr('');
    const changed = SENSITIVE.find((s) => f[s.key] !== biz[s.key]);
    update(
      (s) => {
        const keep = changed ? { [changed.key]: biz[changed.key] } : {};
        Object.assign(s.business, { ...f, ...keep, pendingChange: changed ? { field: changed.key, value: String(f[changed.key]), label: changed.label } : s.business.pendingChange });
      },
      {
        history: changed ? `Updated storefront. ${changed.label} change sent to RigSetGo for a check` : 'Updated storefront',
        toast: changed ? `Saved. The new ${changed.label.toLowerCase()} goes live after a quick check` : 'Storefront saved and live',
        tone: changed ? 'info' : 'success',
      },
    );
    if (changed) setF({ ...f, [changed.key]: biz[changed.key] });
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2 style={{ fontSize: 22 }}>Your public page</h2>
          <p>This is what contractors see. Your name appears on every listing, quote, booking and invoice.</p>
        </div>
        <div className="row">
          <button className="btn btn-secondary" disabled={!dirty} onClick={() => setF(biz)}>
            Discard changes
          </button>
          <button className="btn btn-primary" disabled={!dirty} onClick={save}>
            Save storefront
          </button>
        </div>
      </div>
      {biz.pendingChange && (
        <div className="banner warning">
          <IconHourglass size={20} />
          <div className="grow">
            <b>
              {biz.pendingChange.label} change is waiting for a quick check: “{biz.pendingChange.value}”
            </b>
            The current details stay live until RigSetGo approves it, usually within one business day.
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              const pc = biz.pendingChange!;
              update(
                (s) => {
                  (s.business as unknown as Record<string, unknown>)[pc.field] = pc.value;
                  s.business.pendingChange = undefined;
                },
                { history: `RigSetGo approved the ${pc.label.toLowerCase()} change`, notify: { text: `Your ${pc.label.toLowerCase()} change was approved`, link: '/storefront' }, toast: 'Change approved and live' },
              );
              setF((x) => ({ ...x, [pc.field]: pc.value }));
            }}
          >
            Demo: RigSetGo approves
          </button>
        </div>
      )}
      {err && <div className="banner danger small">{err}</div>}
      <div className="grid g2">
        <section className="card flat">
          <div className="hero-photo" style={{ borderRadius: 0, height: 180 }}>
            <img src={img('images/wheel-loaders.jpg')} alt="" />
          </div>
          <div className="col gap-16" style={{ padding: 24 }}>
            <div className="row">
              <div className="avatar lg" style={{ background: 'var(--navy)', color: '#fff' }}>AH</div>
              <div>
                <div className="strong" style={{ fontSize: 20 }}>{biz.legalName}</div>
                <span className="badge b-green">
                  <IconRosetteDiscountCheck size={14} /> Verified by RigSetGo · {fmtDate(biz.verifiedOn)}
                </span>
              </div>
            </div>
            <div className="row gap-8 small">
              <Stars value={rating} /> <b>{rating.toFixed(1)}</b> <span className="muted">({reviews.length} reviews)</span> · {published.length} machines for rent
            </div>
            <p className="muted">{f.about}</p>
            <div className="col gap-8 small">
              <span className="row gap-8"><IconMapPin size={16} color="var(--navy)" /> Serves {f.serviceAreas.join(', ')}</span>
              <span className="row gap-8"><IconClock size={16} color="var(--navy)" /> {f.days}, {f.opens} – {f.closes}</span>
              <span className="row gap-8"><IconTruck size={16} color="var(--navy)" /> {[f.delivery && 'Delivers to your jobsite', f.pickup && 'Pickup from our yard'].filter(Boolean).join(' · ')}</span>
              <span className="row gap-8"><IconBuilding size={16} color="var(--navy)" /> {biz.phone} · {biz.email}</span>
            </div>
            <div className="divider" />
            <div className="tiny muted">Badge shows what we checked: business registration, insurance and tax ID.</div>
            <div className="row wrap gap-8">
              {published.slice(0, 4).map((e) => (
                <div key={e.id} style={{ width: 'calc(50% - 4px)' }} className="row gap-8">
                  <img className="thumb" src={img(e.photo)} alt="" style={{ width: 56, height: 40 }} />
                  <span className="tiny strong">{e.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="card">
          <h3>Edit your storefront</h3>
          <div className="banner info small">
            <IconInfoCircle size={18} />
            <div className="grow">Changes to the business name, phone or email need a quick check by RigSetGo. Everything else goes live straight away.</div>
          </div>
          <Field label="Business name (needs a check)">
            <input className="input" value={f.legalName} onChange={(e) => setF({ ...f, legalName: e.target.value })} />
          </Field>
          <div className="grid g2" style={{ gap: 16 }}>
            <Field label="Public phone (needs a check)">
              <input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            </Field>
            <Field label="Public email (needs a check)">
              <input className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            </Field>
          </div>
          <Field label="About your business">
            <textarea className="textarea" value={f.about} onChange={(e) => setF({ ...f, about: e.target.value })} />
          </Field>
          <Field label="Service areas">
            <div className="row wrap gap-8" style={{ border: '1px solid var(--line-strong)', borderRadius: 12, padding: '10px 12px' }}>
              {f.serviceAreas.map((a) => (
                <span key={a} className="chip">
                  {a}
                  <button onClick={() => setF({ ...f, serviceAreas: f.serviceAreas.filter((x) => x !== a) })} aria-label={`Remove ${a}`}>
                    <IconX size={14} />
                  </button>
                </span>
              ))}
              <input
                style={{ border: 'none', outline: 'none', flex: 1, minWidth: 140, padding: 6 }}
                value={area}
                placeholder="+ Add area and press Enter"
                onChange={(e) => setArea(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && area.trim()) {
                    setF({ ...f, serviceAreas: [...f.serviceAreas, area.trim()] });
                    setArea('');
                  }
                }}
              />
            </div>
          </Field>
          <div className="grid g3" style={{ gap: 12 }}>
            <Field label="Working days">
              <select className="select" value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })}>
                {['Mon – Fri', 'Mon – Sat', 'Every day'].map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="Opens">
              <select className="select" value={f.opens} onChange={(e) => setF({ ...f, opens: e.target.value })}>
                {['6:00 AM', '7:00 AM', '8:00 AM'].map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="Closes">
              <select className="select" value={f.closes} onChange={(e) => setF({ ...f, closes: e.target.value })}>
                {['5:00 PM', '6:00 PM', '7:00 PM'].map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
          </div>
          <div className="row">
            <label className="check">
              <input type="checkbox" checked={f.delivery} onChange={(e) => setF({ ...f, delivery: e.target.checked })} /> Delivery to jobsite
            </label>
            <label className="check">
              <input type="checkbox" checked={f.pickup} onChange={(e) => setF({ ...f, pickup: e.target.checked })} /> Customer pickup at yard
            </label>
          </div>
          <Field label="Rental policy" hint="Shown before checkout and saved with every booking.">
            <textarea className="textarea" value={f.rentalPolicy} onChange={(e) => setF({ ...f, rentalPolicy: e.target.value })} />
          </Field>
          <Field label="Cancellation policy">
            <textarea className="textarea" value={f.cancellationPolicy} onChange={(e) => setF({ ...f, cancellationPolicy: e.target.value })} />
          </Field>
          <button className="btn btn-primary" disabled={!dirty} onClick={save}>
            Save storefront
          </button>
          {!dirty && <span className="tiny muted" style={{ textAlign: 'center' }}><IconStar size={12} /> All changes are saved</span>}
        </section>
      </div>
    </>
  );
}

