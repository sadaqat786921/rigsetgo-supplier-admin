import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { IconPlus, IconSearch, IconArrowLeft, IconEdit, IconAlertTriangle, IconCircleCheck, IconTrash, IconCheck, IconUpload, IconInfoCircle, IconBox } from '@tabler/icons-react';
import { useStore, uid } from '../store/store';
import { Badge, ConfirmDialog, Empty, Field, Modal, Pills, ReasonDialog, Tabs } from '../components/ui';
import type { AppState, Equipment, EquipmentStatus, Unit } from '../data/types';
import { CATEGORIES, PHOTOS, REQUIRED_DOCS, TODAY } from '../data/seed';
import { blockingDocs, fmtDate, money, overlaps, shortDate, LIVE_STATUSES } from '../data/utils';
import { PricingModal } from './Pricing';
import { UploadDocModal } from './Compliance';

export function listingIssues(s: AppState, e: Equipment): string[] {
  const out: string[] = [];
  if (!e.name.trim() || !e.make.trim() || !e.model.trim()) out.push('Add the make, model and name');
  if (e.description.trim().length < 20) out.push('Write a short description (at least 20 characters)');
  if (!e.photo) out.push('Choose a photo');
  if (!e.units.length) out.push('Add at least one physical unit with its serial number');
  if (!e.pricing) out.push('Set daily, weekly and 4-week prices');
  (REQUIRED_DOCS[e.category] ?? []).forEach((d) => {
    const doc = s.docs.find((x) => x.equipmentId === e.id && x.name === d);
    if (!doc) out.push(`Upload the ${d.toLowerCase()}`);
    else if (doc.status === 'Expired' || doc.status === 'Rejected') out.push(`Replace the ${doc.status.toLowerCase()} ${d.toLowerCase()}`);
  });
  return out;
}

export function unitState(s: AppState, e: Equipment, u: Unit) {
  const b = s.bookings.find((x) => x.equipmentId === e.id && x.unitId === u.id && ['Out for delivery', 'Active', 'Return requested'].includes(x.status));
  if (b) return { label: `On rent · ${b.id}`, tone: 'navy' };
  const bl = s.blocks.find((x) => x.equipmentId === e.id && x.unitId === u.id && overlaps(TODAY, TODAY, x.from, x.to));
  if (bl) return { label: bl.reason === 'Maintenance' ? 'Maintenance' : 'Rented outside', tone: 'orange' };
  return { label: 'Available', tone: 'green' };
}

/* ---------------- List ---------------- */
export function EquipmentList() {
  const { state } = useStore();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'All' | EquipmentStatus>('All');
  const [cat, setCat] = useState('All categories');
  const list = state.equipment.filter(
    (e) => (status === 'All' || e.status === status) && (cat === 'All categories' || e.category === cat) && (e.name + e.make + e.model).toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <div className="page-head">
        <div>
          <h2 style={{ fontSize: 22 }}>{state.equipment.length} machines · {state.equipment.reduce((s, e) => s + e.units.length, 0)} units</h2>
          <p>Every machine you rent out. Each listing can have several real units with their own calendar.</p>
        </div>
        <button className="btn btn-primary" onClick={() => nav('/equipment/new')}>
          <IconPlus size={18} /> Add equipment
        </button>
      </div>
      <section className="card">
        <div className="row between wrap">
          <Pills items={['All', 'Published', 'Draft', 'Maintenance', 'Unavailable', 'Retired'] as const} value={status} onChange={setStatus} />
          <div className="row">
            <select className="select" style={{ width: 200 }} value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
              <option>All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <div className="search" style={{ width: 260 }}>
              <IconSearch size={18} color="var(--muted)" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search equipment" aria-label="Search equipment" />
            </div>
          </div>
        </div>
        {list.length === 0 ? (
          <Empty title="No equipment found" text="Try another filter, or add a new machine." action={<button className="btn btn-primary" onClick={() => nav('/equipment/new')}>Add equipment</button>} icon={<IconBox size={28} />} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Units</th>
                  <th>Daily rate</th>
                  <th>Booking mode</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((e) => {
                  const blocked = blockingDocs(state, e).length > 0;
                  return (
                    <tr key={e.id} className="click" onClick={() => nav(`/equipment/${e.id}`)}>
                      <td>
                        <div className="row">
                          <img className="thumb" src={e.photo} alt="" />
                          <div>
                            <div className="strong">{e.name}</div>
                            <div className="tiny muted">
                              {e.category} · {e.year} · {e.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{e.units.length}</td>
                      <td>{e.pricing ? money(e.pricing.daily) : <span className="muted">Not set</span>}</td>
                      <td>{e.bookingMode === 'instant' ? 'Instant booking' : 'Quote only'}</td>
                      <td>
                        <div className="row gap-8">
                          <Badge>{e.status}</Badge>
                          {blocked && <Badge tone="red">Bookings paused</Badge>}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="link">Open</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

/* ---------------- Detail ---------------- */
export function EquipmentDetail() {
  const { id } = useParams();
  const { state, update, toast } = useStore();
  const nav = useNavigate();
  const e = state.equipment.find((x) => x.id === id);
  const [tab, setTab] = useState<'Overview' | 'Units' | 'Pricing' | 'Documents' | 'Bookings'>('Overview');
  const [modal, setModal] = useState<'' | 'status' | 'pricing' | 'unit' | 'publish' | 'delete' | 'retire'>('');
  const [unitEdit, setUnitEdit] = useState<Unit | null>(null);
  const [removeUnit, setRemoveUnit] = useState<Unit | null>(null);
  const [upload, setUpload] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<EquipmentStatus>('Published');
  if (!e) return <Empty title="Equipment not found" action={<Link to="/equipment" className="btn btn-secondary">Back to equipment</Link>} />;
  const blocked = blockingDocs(state, e);
  const issues = listingIssues(state, e);
  const bookings = state.bookings.filter((b) => b.equipmentId === e.id);
  const docs = state.docs.filter((d) => d.equipmentId === e.id);
  const required = REQUIRED_DOCS[e.category] ?? [];

  const setStatus = (st: EquipmentStatus, reason?: string) =>
    update(
      (s) => {
        const x = s.equipment.find((y) => y.id === e.id)!;
        x.status = st;
      },
      { history: `Changed ${e.name} status to ${st}${reason ? ` (${reason})` : ''}`, toast: `${e.name} is now ${st}` },
    );

  return (
    <>
      <button className="back" onClick={() => nav('/equipment')}>
        <IconArrowLeft size={16} /> All equipment
      </button>
      {blocked.length > 0 && (
        <div className="banner danger">
          <IconAlertTriangle size={20} />
          <div className="grow">
            <b>New bookings are paused for this machine</b>
            {blocked.map((d) => `${d.name} ${d.status.toLowerCase()}`).join(', ')}. Upload a new document to open bookings again.
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => setUpload(blocked[0].name)}>
            Upload new document
          </button>
        </div>
      )}
      {e.status === 'Draft' && (
        <div className="banner info">
          <IconInfoCircle size={20} />
          <div className="grow">
            <b>This listing is a draft</b>Contractors cannot see it yet. Finish the missing items, then publish.
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setModal('publish')}>
            Check and publish
          </button>
        </div>
      )}
      <section className="card" style={{ flexDirection: 'row', gap: 24 }}>
        <div className="hero-photo" style={{ width: 360, flex: 'none', height: 240 }}>
          <img src={e.photo} alt={e.name} />
        </div>
        <div className="col gap-16 grow">
          <div className="row between top">
            <div>
              <div className="row gap-8">
                <Badge>{e.status}</Badge>
                <Badge tone="navy">{e.bookingMode === 'instant' ? 'Instant booking' : 'Quote only'}</Badge>
              </div>
              <h2 style={{ fontSize: 26, marginTop: 8 }}>{e.name}</h2>
              <div className="muted">
                {e.category} · {e.make} {e.model} · {e.year} · {e.id}
              </div>
            </div>
            <div className="row">
              <button className="btn btn-secondary" onClick={() => nav(`/equipment/${e.id}/edit`)}>
                <IconEdit size={18} /> Edit listing
              </button>
              {e.status === 'Draft' ? (
                <button className="btn btn-secondary" onClick={() => setModal('delete')}>
                  <IconTrash size={18} /> Delete draft
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setNewStatus(e.status === 'Published' ? 'Unavailable' : 'Published');
                    setModal('status');
                  }}
                >
                  Change status
                </button>
              )}
            </div>
          </div>
          <p className="muted">{e.description}</p>
          <div className="grid g4" style={{ gap: 12 }}>
            {[
              ['Daily', e.pricing ? money(e.pricing.daily) : '—'],
              ['Weekly', e.pricing ? money(e.pricing.weekly) : '—'],
              ['4 weeks', e.pricing ? money(e.pricing.fourWeek) : '—'],
              ['Units', String(e.units.length)],
            ].map(([l, v]) => (
              <div key={l} className="stat">
                <span className="label">{l}</span>
                <span className="value" style={{ fontSize: 20 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <Tabs tabs={['Overview', 'Units', 'Pricing', 'Documents', 'Bookings'] as const} value={tab} onChange={setTab} counts={{ Units: e.units.length, Documents: docs.length, Bookings: bookings.length }} />
        {tab === 'Overview' && (
          <div className="grid g2">
            <div className="col gap-16">
              {[
                ['Weight', e.weight],
                ['Capacity', e.capacity],
                ['Power / fuel', e.fuel],
                ['Transport', e.transport],
              ].map(([l, v]) => (
                <div key={l} className="row between" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
                  <span className="muted">{l}</span>
                  <b>{v || '—'}</b>
                </div>
              ))}
            </div>
            <div className="col gap-16">
              <div>
                <div className="muted small">Operator</div>
                <b>{e.operatorRequired ? 'Certified operator required' : 'No operator required'}</b>
              </div>
              <div>
                <div className="muted small">Attachments included</div>
                <div className="row wrap gap-8" style={{ marginTop: 6 }}>
                  {e.attachments.length ? e.attachments.map((a) => <span key={a} className="chip">{a}</span>) : <span className="muted">None</span>}
                </div>
              </div>
              <div>
                <div className="muted small">Uses not allowed</div>
                <b>{e.prohibitedUses || 'None listed'}</b>
              </div>
            </div>
          </div>
        )}
        {tab === 'Units' && (
          <>
            <div className="row between">
              <span className="muted small">Serial and VIN numbers are private. Contractors only see the unit number.</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal('unit')}>
                <IconPlus size={16} /> Add unit
              </button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Serial / VIN (private)</th>
                  <th>Condition</th>
                  <th>Meter hours</th>
                  <th>Today</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {e.units.map((u) => {
                  const st = unitState(state, e, u);
                  return (
                    <tr key={u.id}>
                      <td className="strong">#{u.id}</td>
                      <td>{u.serial}</td>
                      <td>{u.condition}</td>
                      <td>{u.meterHours.toLocaleString()}</td>
                      <td>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => nav(`/calendar?eq=${e.id}&unit=${u.id}`)}>
                          Calendar
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setUnitEdit(u)}>
                          Edit
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setRemoveUnit(u)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {e.units.length === 0 && <Empty title="No units yet" text="Add each real machine with its serial number." />}
          </>
        )}
        {tab === 'Pricing' && (
          <>
            {e.pricing ? (
              <div className="grid g4" style={{ gap: 12 }}>
                {[
                  ['Daily rate', money(e.pricing.daily)],
                  ['Weekly rate', money(e.pricing.weekly)],
                  ['4-week rate', money(e.pricing.fourWeek)],
                  ['Minimum rental', `${e.pricing.minDays} days`],
                  ['Hours included', `${e.pricing.hoursPerDay} h / day`],
                  ['Overtime', `${money(e.pricing.overtimePerHour)} / hour`],
                  ['Delivery fee', money(e.pricing.deliveryFee)],
                  ['Deposit', money(e.pricing.deposit)],
                ].map(([l, v]) => (
                  <div key={l} className="stat">
                    <span className="label">{l}</span>
                    <span className="value" style={{ fontSize: 18 }}>{v}</span>
                  </div>
                ))}
              </div>
            ) : (
              <Empty title="No prices yet" text="Set prices before you publish this machine." />
            )}
            <div>
              <button className="btn btn-primary" onClick={() => setModal('pricing')}>
                {e.pricing ? 'Edit prices' : 'Set prices'}
              </button>
            </div>
          </>
        )}
        {tab === 'Documents' && (
          <>
            <div className="muted small">Documents needed for {e.category.toLowerCase()}: {required.join(', ') || 'none'}.</div>
            <table className="table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>File</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {required.map((name) => {
                  const d = docs.find((x) => x.name === name);
                  return (
                    <tr key={name}>
                      <td className="strong">{name}</td>
                      <td>{d?.file ?? <span className="muted">Not uploaded</span>}</td>
                      <td>{d ? fmtDate(d.expires) : '—'}</td>
                      <td>{d ? <Badge>{d.status}</Badge> : <Badge tone="red">Missing</Badge>}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setUpload(name)}>
                          <IconUpload size={16} /> {d ? 'Replace' : 'Upload'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
        {tab === 'Bookings' &&
          (bookings.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Contractor</th>
                  <th>Unit</th>
                  <th>Dates</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="click" onClick={() => nav(`/bookings/${b.id}`)}>
                    <td className="strong">{b.id}</td>
                    <td>{b.contractor}</td>
                    <td>#{b.unitId}</td>
                    <td>
                      {shortDate(b.start)} – {shortDate(b.end)}
                    </td>
                    <td>
                      <Badge>{b.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty title="No bookings yet" text="Bookings for this machine will show here." />
          ))}
      </section>

      {modal === 'status' && (
        <Modal
          title="Change status"
          sub="Only Published machines show in contractor search."
          onClose={() => setModal('')}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModal('')}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (newStatus === 'Retired') return setModal('retire');
                  if (newStatus === 'Published' && issues.length) return setModal('publish');
                  setStatus(newStatus);
                  setModal('');
                }}
              >
                Save status
              </button>
            </>
          }
        >
          {(['Published', 'Unavailable', 'Maintenance', 'Retired'] as EquipmentStatus[]).map((st) => (
            <label key={st} className={`option ${newStatus === st ? 'selected' : ''}`}>
              <input type="radio" checked={newStatus === st} onChange={() => setNewStatus(st)} />
              <span className="grow">
                <div className="strong">{st}</div>
                <div className="tiny muted">
                  {st === 'Published' ? 'Visible in search and bookable.' : st === 'Unavailable' ? 'Hidden from search for now. Existing bookings stay.' : st === 'Maintenance' ? 'In the workshop. Hidden from search.' : 'Removed for good. Kept in history.'}
                </div>
              </span>
            </label>
          ))}
          {LIVE_STATUSES && bookings.some((b) => LIVE_STATUSES.includes(b.status)) && newStatus !== 'Published' && (
            <div className="banner warning small">
              <IconAlertTriangle size={18} />
              <div className="grow">This machine has upcoming or active bookings. They are not cancelled by this change.</div>
            </div>
          )}
        </Modal>
      )}
      {modal === 'retire' && (
        <ReasonDialog
          title={`Retire ${e.name}?`}
          text="Retired machines disappear from search but stay in your history."
          confirmLabel="Retire machine"
          danger
          onConfirm={(r) => setStatus('Retired', r)}
          onClose={() => setModal('')}
        />
      )}
      {modal === 'publish' && (
        <Modal
          title={issues.length ? 'A few things are missing' : 'Ready to publish'}
          sub={issues.length ? 'Fix these items, then publish again.' : 'Every listing check passed.'}
          onClose={() => setModal('')}
          footer={
            issues.length ? (
              <>
                <button className="btn btn-secondary" onClick={() => setModal('')}>
                  Close
                </button>
                <button className="btn btn-primary" onClick={() => nav(`/equipment/${e.id}/edit`)}>
                  Fix in the listing
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={() => setModal('')}>
                  Not now
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setStatus('Published');
                    setModal('');
                  }}
                >
                  Publish now
                </button>
              </>
            )
          }
        >
          {issues.length ? (
            issues.map((i) => (
              <div key={i} className="banner danger small">
                <IconAlertTriangle size={18} />
                <div className="grow">{i}</div>
              </div>
            ))
          ) : (
            <div className="banner success">
              <IconCircleCheck size={20} />
              <div className="grow">Photos, details, units, prices and documents are all in place.</div>
            </div>
          )}
        </Modal>
      )}
      {modal === 'delete' && (
        <ConfirmDialog
          title="Delete this draft?"
          text="The draft listing and its units will be removed. This cannot be undone."
          confirmLabel="Delete draft"
          danger
          onConfirm={() => {
            update((s) => (s.equipment = s.equipment.filter((x) => x.id !== e.id)), { history: `Deleted draft ${e.name}`, toast: 'Draft deleted' });
            nav('/equipment');
          }}
          onClose={() => setModal('')}
        />
      )}
      {modal === 'pricing' && <PricingModal eq={e} onClose={() => setModal('')} />}
      {(modal === 'unit' || unitEdit) && (
        <UnitModal
          unit={unitEdit}
          existing={e.units.map((u) => u.id)}
          onClose={() => {
            setModal('');
            setUnitEdit(null);
          }}
          onSave={(u) => {
            update(
              (s) => {
                const x = s.equipment.find((y) => y.id === e.id)!;
                const i = x.units.findIndex((y) => y.id === u.id);
                if (i >= 0) x.units[i] = u;
                else x.units.push(u);
              },
              { history: `${unitEdit ? 'Updated' : 'Added'} unit #${u.id} on ${e.name}`, toast: unitEdit ? 'Unit updated' : `Unit #${u.id} added` },
            );
            setModal('');
            setUnitEdit(null);
          }}
        />
      )}
      {removeUnit && (
        <ConfirmDialog
          title={`Remove unit #${removeUnit.id}?`}
          text={
            bookings.some((b) => b.unitId === removeUnit.id && LIVE_STATUSES.includes(b.status))
              ? 'This unit has upcoming or active bookings, so it cannot be removed yet. Move or finish those bookings first.'
              : 'The unit and its calendar will be removed from this listing.'
          }
          confirmLabel="Remove unit"
          danger
          onConfirm={() => {
            if (bookings.some((b) => b.unitId === removeUnit.id && LIVE_STATUSES.includes(b.status))) {
              toast('This unit has bookings and was not removed', 'warning');
              return;
            }
            update((s) => {
              const x = s.equipment.find((y) => y.id === e.id)!;
              x.units = x.units.filter((u) => u.id !== removeUnit.id);
            }, { history: `Removed unit #${removeUnit.id} from ${e.name}`, toast: 'Unit removed' });
          }}
          onClose={() => setRemoveUnit(null)}
        />
      )}
      {upload && <UploadDocModal name={upload} equipment={e} onClose={() => setUpload(null)} />}
    </>
  );
}

function UnitModal({ unit, existing, onClose, onSave }: { unit: Unit | null; existing: string[]; onClose: () => void; onSave: (u: Unit) => void }) {
  const [u, setU] = useState<Unit>(unit ?? { id: `U-${Math.floor(90 + Math.random() * 9)}${existing.length}`, serial: '', condition: 'Good', meterHours: 0 });
  const [err, setErr] = useState('');
  return (
    <Modal
      title={unit ? `Edit unit #${unit.id}` : 'Add a unit'}
      sub="Each unit is one real machine with its own calendar."
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (u.serial.trim().length < 5) return setErr('Enter the serial or VIN number (at least 5 characters).');
              onSave(u);
            }}
          >
            Save unit
          </button>
        </>
      }
    >
      <div className="grid g2" style={{ gap: 16 }}>
        <Field label="Unit number">
          <input className="input" value={u.id} disabled={!!unit} onChange={(e) => setU({ ...u, id: e.target.value })} />
        </Field>
        <Field label="Serial / VIN (private)" error={err}>
          <input className={`input ${err ? 'invalid' : ''}`} value={u.serial} onChange={(e) => setU({ ...u, serial: e.target.value.toUpperCase() })} placeholder="e.g. CAT0320GKL01442" />
        </Field>
        <Field label="Condition">
          <select className="select" value={u.condition} onChange={(e) => setU({ ...u, condition: e.target.value as Unit['condition'] })}>
            <option>Excellent</option>
            <option>Good</option>
            <option>Fair</option>
          </select>
        </Field>
        <Field label="Meter hours">
          <input className="input" type="number" value={u.meterHours} onChange={(e) => setU({ ...u, meterHours: Number(e.target.value) })} />
        </Field>
      </div>
    </Modal>
  );
}

/* ---------------- Add / edit wizard ---------------- */
const WSTEPS = ['Basics', 'Details', 'Units', 'Price', 'Documents', 'Check'] as const;

export function EquipmentWizard() {
  const { id } = useParams();
  const { state, update } = useStore();
  const nav = useNavigate();
  const existing = state.equipment.find((x) => x.id === id);
  const newId = useMemo(() => `EQ-${110 + state.equipment.length}`, [state.equipment.length]);
  const [e, setE] = useState<Equipment>(
    () =>
      existing ??
      {
        id: newId, name: '', category: 'Excavators', make: '', model: '', year: 2024, photo: PHOTOS[0], description: '', weight: '', capacity: '', fuel: 'Diesel', transport: '',
        operatorRequired: false, attachments: [], prohibitedUses: '', status: 'Draft', bookingMode: 'instant', pricing: null, units: [],
      },
  );
  const [step, setStep] = useState(0);
  const [att, setAtt] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [showUnit, setShowUnit] = useState(false);
  const [upload, setUpload] = useState<string | null>(null);
  const p = e.pricing ?? { daily: 0, weekly: 0, fourWeek: 0, minDays: 1, hoursPerDay: 8, overtimePerHour: 0, deliveryFee: 0, deposit: 0, weekendRule: 'Weekends charged' as const };

  const persist = (status?: EquipmentStatus) => {
    const next = { ...e, status: status ?? e.status };
    update(
      (s) => {
        const i = s.equipment.findIndex((x) => x.id === e.id);
        if (i >= 0) s.equipment[i] = next;
        else s.equipment.unshift(next);
      },
      { history: `${existing ? 'Updated' : 'Created'} listing ${next.name || next.id}${status === 'Published' ? ' and published it' : ''}`, toast: status === 'Published' ? `${next.name} is published` : 'Saved as draft' },
    );
  };

  const stepErrors = (n: number) => {
    const out: string[] = [];
    if (n === 0 && (!e.make.trim() || !e.model.trim() || !e.name.trim())) out.push('Fill in the name, make and model.');
    if (n === 1 && e.description.trim().length < 20) out.push('Write a description of at least 20 characters.');
    if (n === 2 && !e.units.length) out.push('Add at least one unit.');
    if (n === 3 && (!p.daily || !p.weekly || !p.fourWeek)) out.push('Enter daily, weekly and 4-week rates.');
    return out;
  };

  const next = () => {
    const err = stepErrors(step);
    setErrors(err);
    if (!err.length) {
      if (step === 3 && !e.pricing) setE({ ...e, pricing: p });
      if (step === 4 && !state.equipment.some((x) => x.id === e.id)) persist('Draft');
      setStep(step + 1);
    }
  };

  const setP = (patch: Partial<typeof p>) => setE({ ...e, pricing: { ...p, ...patch } });
  const liveEq = state.equipment.find((x) => x.id === e.id) ? { ...e } : e;
  const issues = listingIssues(state, liveEq);

  return (
    <>
      <button className="back" onClick={() => nav(existing ? `/equipment/${existing.id}` : '/equipment')}>
        <IconArrowLeft size={16} /> {existing ? 'Back to listing' : 'All equipment'}
      </button>
      <section className="card" style={{ maxWidth: 900 }}>
        <div className="card-head">
          <div>
            <h2 style={{ fontSize: 22 }}>{existing ? `Edit ${existing.name}` : 'Add equipment'}</h2>
            <div className="muted small">Step {step + 1} of 6 · {WSTEPS[step]}</div>
          </div>
          <button className="btn btn-secondary" onClick={() => { persist(existing?.status ?? 'Draft'); nav(`/equipment/${e.id}`); }}>
            Save and close
          </button>
        </div>
        <div className="stepper">
          {WSTEPS.map((s, i) => (
            <div key={s} className={`s ${i < step ? 'done' : i === step ? 'now' : ''}`}>
              <div className="line">
                <i className={i === 0 ? 'hide' : i <= step ? 'on' : ''} />
                <span className="c">{i < step ? <IconCheck size={14} stroke={3} /> : i + 1}</span>
                <i className={i === 5 ? 'hide' : i < step ? 'on' : ''} />
              </div>
              {s}
            </div>
          ))}
        </div>
        {errors.map((x) => (
          <div key={x} className="banner danger small">
            <IconAlertTriangle size={18} />
            <div className="grow">{x}</div>
          </div>
        ))}

        {step === 0 && (
          <>
            <div className="grid g2" style={{ gap: 16 }}>
              <Field label="Category">
                <select className="select" value={e.category} onChange={(x) => setE({ ...e, category: x.target.value })}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Listing name" hint="What contractors will see, e.g. “CAT 320 Excavator”.">
                <input className="input" value={e.name} onChange={(x) => setE({ ...e, name: x.target.value })} />
              </Field>
              <Field label="Make">
                <input className="input" value={e.make} onChange={(x) => setE({ ...e, make: x.target.value })} placeholder="Caterpillar" />
              </Field>
              <Field label="Model">
                <input className="input" value={e.model} onChange={(x) => setE({ ...e, model: x.target.value })} placeholder="320" />
              </Field>
              <Field label="Year">
                <input className="input" type="number" value={e.year} onChange={(x) => setE({ ...e, year: Number(x.target.value) })} />
              </Field>
            </div>
            <Field label="Photo" hint="Choose the photo contractors will see first.">
              <div className="photo-pick">
                {PHOTOS.map((ph) => (
                  <button key={ph} className={e.photo === ph ? 'on' : ''} onClick={() => setE({ ...e, photo: ph })} aria-label="Choose photo">
                    <img src={ph} alt="" />
                  </button>
                ))}
              </div>
            </Field>
          </>
        )}
        {step === 1 && (
          <>
            <Field label="Description">
              <textarea className="textarea" value={e.description} onChange={(x) => setE({ ...e, description: x.target.value })} placeholder="What is it good for? What is included?" />
            </Field>
            <div className="grid g2" style={{ gap: 16 }}>
              <Field label="Weight">
                <input className="input" value={e.weight} onChange={(x) => setE({ ...e, weight: x.target.value })} placeholder="22.5 t" />
              </Field>
              <Field label="Capacity">
                <input className="input" value={e.capacity} onChange={(x) => setE({ ...e, capacity: x.target.value })} placeholder="1.2 m³ bucket" />
              </Field>
              <Field label="Power / fuel">
                <select className="select" value={e.fuel} onChange={(x) => setE({ ...e, fuel: x.target.value })}>
                  <option>Diesel</option>
                  <option>Electric</option>
                  <option>Gasoline</option>
                </select>
              </Field>
              <Field label="Transport needs">
                <input className="input" value={e.transport} onChange={(x) => setE({ ...e, transport: x.target.value })} placeholder="Lowboy trailer" />
              </Field>
            </div>
            <label className="check">
              <input type="checkbox" checked={e.operatorRequired} onChange={(x) => setE({ ...e, operatorRequired: x.target.checked })} /> A certified operator is required
            </label>
            <Field label="Attachments included">
              <div className="row wrap gap-8">
                {e.attachments.map((a) => (
                  <span key={a} className="chip">
                    {a}
                    <button onClick={() => setE({ ...e, attachments: e.attachments.filter((y) => y !== a) })} aria-label={`Remove ${a}`}>
                      ×
                    </button>
                  </span>
                ))}
                <input
                  className="input"
                  style={{ width: 240 }}
                  value={att}
                  onChange={(x) => setAtt(x.target.value)}
                  placeholder="Add and press Enter"
                  onKeyDown={(x) => {
                    if (x.key === 'Enter' && att.trim()) {
                      setE({ ...e, attachments: [...e.attachments, att.trim()] });
                      setAtt('');
                    }
                  }}
                />
              </div>
            </Field>
            <Field label="Uses that are not allowed">
              <input className="input" value={e.prohibitedUses} onChange={(x) => setE({ ...e, prohibitedUses: x.target.value })} placeholder="e.g. Demolition of structures" />
            </Field>
          </>
        )}
        {step === 2 && (
          <>
            <div className="row between">
              <span className="muted small">Add every real machine of this model. Serial numbers stay private.</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowUnit(true)}>
                <IconPlus size={16} /> Add unit
              </button>
            </div>
            {e.units.length === 0 ? (
              <Empty title="No units yet" text="Add at least one unit to continue." />
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Unit</th>
                    <th>Serial / VIN</th>
                    <th>Condition</th>
                    <th>Meter hours</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {e.units.map((u) => (
                    <tr key={u.id}>
                      <td className="strong">#{u.id}</td>
                      <td>{u.serial}</td>
                      <td>{u.condition}</td>
                      <td>{u.meterHours}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setE({ ...e, units: e.units.filter((y) => y.id !== u.id) })}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {showUnit && (
              <UnitModal
                unit={null}
                existing={e.units.map((u) => u.id)}
                onClose={() => setShowUnit(false)}
                onSave={(u) => {
                  setE({ ...e, units: [...e.units, u] });
                  setShowUnit(false);
                }}
              />
            )}
          </>
        )}
        {step === 3 && (
          <>
            <div className="grid g3" style={{ gap: 16 }}>
              {(
                [
                  ['Daily rate ($)', 'daily'],
                  ['Weekly rate ($)', 'weekly'],
                  ['4-week rate ($)', 'fourWeek'],
                  ['Minimum rental (days)', 'minDays'],
                  ['Engine hours included per day', 'hoursPerDay'],
                  ['Overtime per hour ($)', 'overtimePerHour'],
                  ['Delivery fee ($)', 'deliveryFee'],
                  ['Deposit ($)', 'deposit'],
                ] as const
              ).map(([l, k]) => (
                <Field key={k} label={l}>
                  <input className="input" type="number" min={0} value={p[k] || ''} onChange={(x) => setP({ [k]: Number(x.target.value) })} />
                </Field>
              ))}
              <Field label="Weekends">
                <select className="select" value={p.weekendRule} onChange={(x) => setP({ weekendRule: x.target.value as typeof p.weekendRule })}>
                  <option>Weekends charged</option>
                  <option>Weekends free</option>
                </select>
              </Field>
            </div>
            <Field label="How contractors book">
              <div className="grid g2" style={{ gap: 16 }}>
                {[
                  { v: 'instant' as const, t: 'Instant booking', d: 'Contractors book and pay straight away.' },
                  { v: 'quote' as const, t: 'Quote only', d: 'Contractors ask for a price first.' },
                ].map((o) => (
                  <label key={o.v} className={`option ${e.bookingMode === o.v ? 'selected' : ''}`}>
                    <input type="radio" checked={e.bookingMode === o.v} onChange={() => setE({ ...e, bookingMode: o.v })} />
                    <span>
                      <div className="strong">{o.t}</div>
                      <div className="tiny muted">{o.d}</div>
                    </span>
                  </label>
                ))}
              </div>
            </Field>
          </>
        )}
        {step === 4 && (
          <>
            <div className="muted small">Documents needed for {e.category.toLowerCase()}. The list per equipment type comes from RigSetGo.</div>
            {(REQUIRED_DOCS[e.category] ?? []).map((name) => {
              const d = state.docs.find((x) => x.equipmentId === e.id && x.name === name);
              return (
                <div key={name} className="doc-row">
                  <div className="row">
                    <span className="icon-circle">
                      <IconUpload size={18} />
                    </span>
                    <div className="grow">
                      <div className="strong">{name}</div>
                      <div className="tiny muted">{d ? `${d.file} · expires ${fmtDate(d.expires)}` : 'Not uploaded yet'}</div>
                    </div>
                    {d ? <Badge>{d.status}</Badge> : <Badge tone="red">Missing</Badge>}
                    <button className="btn btn-secondary btn-sm" onClick={() => setUpload(name)}>
                      {d ? 'Replace' : 'Upload'}
                    </button>
                  </div>
                </div>
              );
            })}
            {upload && <UploadDocModal name={upload} equipment={e} onClose={() => setUpload(null)} />}
          </>
        )}
        {step === 5 && (
          <>
            {issues.length ? (
              <>
                <div className="strong">Before this machine can go live:</div>
                {issues.map((x) => (
                  <div key={x} className="banner danger small">
                    <IconAlertTriangle size={18} />
                    <div className="grow">{x}</div>
                  </div>
                ))}
                <div className="muted small">You can save it as a draft and finish later.</div>
              </>
            ) : (
              <div className="banner success">
                <IconCircleCheck size={20} />
                <div className="grow">
                  <b>Every listing check passed</b>Photos, details, units, prices and documents are all in place.
                </div>
              </div>
            )}
            <div className="row gap-16">
              <img className="thumb" src={e.photo} alt="" style={{ width: 120, height: 84 }} />
              <div>
                <div className="strong" style={{ fontSize: 18 }}>{e.name || 'Untitled'}</div>
                <div className="muted small">
                  {e.category} · {e.units.length} units · {e.pricing ? `${money(e.pricing.daily)} / day` : 'no price'} · {e.bookingMode === 'instant' ? 'Instant booking' : 'Quote only'}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="row between" style={{ borderTop: '1px solid var(--line)', paddingTop: 18 }}>
          <button className="btn btn-secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>
            <IconArrowLeft size={18} /> Back
          </button>
          {step < 5 ? (
            <button className="btn btn-primary" onClick={next}>
              Continue
            </button>
          ) : (
            <div className="row">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  persist('Draft');
                  nav(`/equipment/${e.id}`);
                }}
              >
                Save as draft
              </button>
              <button
                className="btn btn-primary"
                disabled={issues.length > 0}
                onClick={() => {
                  persist('Published');
                  nav(`/equipment/${e.id}`);
                }}
              >
                Publish listing
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
