import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { IconArrowLeft, IconPlus, IconTrash, IconAlertTriangle, IconCircleCheck, IconSend, IconX, IconFileText, IconInfoCircle } from '@tabler/icons-react';
import { useStore } from '../store/store';
import { Avatar, Badge, Empty, Field, Modal, ReasonDialog, Tabs } from '../components/ui';
import type { Pricing, QuoteLine, QuoteRequest } from '../data/types';
import { TODAY } from '../data/seed';
import { addDays, blockingDocs, fmtDate, fmtStamp, money, rentalDays, shortDate, unitConflict } from '../data/utils';
import { img } from '../data/images';

export function priceFor(p: Pricing, days: number) {
  const w4 = Math.floor(days / 28);
  let rem = days % 28;
  const w = Math.floor(rem / 7);
  rem %= 7;
  return w4 * p.fourWeek + w * p.weekly + Math.min(rem * p.daily, p.weekly);
}

type QTab = 'New' | 'Quoted' | 'Accepted' | 'Declined or expired' | 'All';

export function QuoteList() {
  const { state } = useStore();
  const nav = useNavigate();
  const [tab, setTab] = useState<QTab>('New');
  const match = (q: QuoteRequest) => (tab === 'All' ? true : tab === 'Declined or expired' ? q.status === 'Declined' || q.status === 'Expired' : q.status === tab);
  const list = state.quotes.filter(match);
  const count = (t: QTab) => state.quotes.filter((q) => (t === 'All' ? true : t === 'Declined or expired' ? q.status === 'Declined' || q.status === 'Expired' : q.status === t)).length;
  return (
    <>
      <div className="page-head">
        <div>
          <h2 style={{ fontSize: 22 }}>Contractors asking for a price</h2>
          <p>Reply quickly. Contractors usually accept the first clear quote they receive.</p>
        </div>
      </div>
      <section className="card">
        <Tabs tabs={['New', 'Quoted', 'Accepted', 'Declined or expired', 'All'] as QTab[]} value={tab} onChange={setTab} counts={{ New: count('New'), Quoted: count('Quoted') }} />
        {list.length === 0 ? (
          <Empty title="No quote requests here" text="New requests from contractors will appear in the New tab." icon={<IconFileText size={28} />} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Contractor</th>
                  <th>Needs</th>
                  <th>Dates</th>
                  <th>Reply by</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((q) => (
                  <tr key={q.id} className="click" onClick={() => nav(`/quotes/${q.id}`)}>
                    <td>
                      <div className="strong">{q.id}</div>
                      <div className="tiny muted">{fmtStamp(q.received)}</div>
                    </td>
                    <td>
                      <div className="row">
                        <Avatar name={q.contractor} size="sm" />
                        {q.contractor}
                      </div>
                    </td>
                    <td>{q.need}</td>
                    <td>
                      {shortDate(q.start)} – {shortDate(q.end)}
                    </td>
                    <td>{q.status === 'New' ? <Badge tone={q.respondBy <= TODAY ? 'red' : 'orange'}>{q.respondBy <= TODAY ? 'Today' : shortDate(q.respondBy)}</Badge> : '—'}</td>
                    <td>
                      <Badge>{q.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

export function QuoteDetail() {
  const { id } = useParams();
  const { state, update } = useStore();
  const nav = useNavigate();
  const q = state.quotes.find((x) => x.id === id);
  const [modal, setModal] = useState<'' | 'send' | 'decline' | 'withdraw'>('');
  if (!q) return <Empty title="Quote request not found" action={<Link className="btn btn-secondary" to="/quotes">Back to quote requests</Link>} />;
  const eq = state.equipment.find((e) => e.id === q.equipmentId)!;
  const days = rentalDays(q.start, q.end);
  const freeUnits = eq.units.filter((u) => !unitConflict(state, eq.id, u.id, q.start, q.end));
  const paused = blockingDocs(state, eq);
  const quoteTotal = q.quote?.lines.reduce((s, l) => s + l.amount, 0) ?? 0;

  const accept = () => {
    const unit = freeUnits[0] ?? eq.units[0];
    const bookingId = `RSG-${10500 + state.bookings.length}`;
    const rental = q.quote!.lines.filter((l) => !/deliver/i.test(l.label)).reduce((s, l) => s + l.amount, 0);
    const deliveryFee = q.quote!.lines.filter((l) => /deliver/i.test(l.label)).reduce((s, l) => s + l.amount, 0);
    update(
      (s) => {
        const x = s.quotes.find((y) => y.id === q.id)!;
        x.status = 'Accepted';
        x.bookingId = bookingId;
        s.bookings.unshift({
          id: bookingId, contractor: q.contractor, contactName: q.contactName, rating: 4.7, equipmentId: eq.id, unitId: unit.id, start: q.start, end: q.end, jobsite: q.jobsite,
          siteContact: q.contactName, fulfillment: 'delivery', status: 'Confirmed', payment: 'Paid', paymentMethod: 'Card · Stripe', rental, deliveryFee, tax: Math.round((rental + deliveryFee) * 0.06),
          deposit: eq.pricing?.deposit ?? 0, poNumber: '', timeline: [{ time: `${TODAY} 12:00`, text: `Quote ${q.id} accepted and paid by ${q.contactName}` }],
        });
        s.jobs.unshift({ id: `JOB-${400 + s.jobs.length}`, bookingId, type: 'Delivery', date: q.start, window: q.deliveryWindow, driverId: null, status: 'Needs driver', progress: 0, distance: 12 });
      },
      { history: `${q.contractor} accepted quote ${q.id}. Booking ${bookingId} created`, notify: { text: `${q.contractor} accepted your quote. Booking ${bookingId} is confirmed`, link: `/bookings/${bookingId}` }, toast: `Quote accepted. Booking ${bookingId} created` },
    );
  };

  return (
    <>
      <button className="back" onClick={() => nav('/quotes')}>
        <IconArrowLeft size={16} /> All quote requests
      </button>
      <div className="grid g-main">
        <section className="card">
          <div className="row between top">
            <div>
              <div className="row gap-8">
                <Badge>{q.status}</Badge>
                <span className="muted small">
                  {q.id} · received {fmtStamp(q.received)}
                </span>
              </div>
              <h2 style={{ fontSize: 24, marginTop: 8 }}>{q.need}</h2>
            </div>
            <div className="row">
              {q.status === 'New' && (
                <>
                  <button className="btn btn-secondary" onClick={() => setModal('decline')}>
                    <IconX size={18} /> Decline
                  </button>
                  <button className="btn btn-primary" onClick={() => setModal('send')}>
                    <IconSend size={18} /> Send a quote
                  </button>
                </>
              )}
              {q.status === 'Expired' && (
                <button className="btn btn-primary" onClick={() => setModal('send')}>
                  Send a new quote
                </button>
              )}
              {q.status === 'Accepted' && q.bookingId && (
                <button className="btn btn-primary" onClick={() => nav(`/bookings/${q.bookingId}`)}>
                  Open booking {q.bookingId}
                </button>
              )}
            </div>
          </div>
          <div className="grid g3" style={{ gap: 12 }}>
            {[
              ['Dates', `${fmtDate(q.start)} – ${fmtDate(q.end)}`],
              ['Rental days', `${days} days`],
              ['Delivery window', q.deliveryWindow],
              ['Jobsite', q.jobsite],
              ['Operator', q.operator ? 'Certified operator needed' : 'Not needed'],
              ['Budget', q.budget || 'Not given'],
            ].map(([l, v]) => (
              <div key={l} className="stat">
                <span className="label">{l}</span>
                <span className="strong">{v}</span>
              </div>
            ))}
          </div>
          {q.notes && (
            <div className="banner info small">
              <IconInfoCircle size={18} />
              <div className="grow">
                <b>Notes from {q.contactName}</b>
                {q.notes}
              </div>
            </div>
          )}
          {q.quote && (
            <div className="card" style={{ background: 'var(--navy-50)', borderColor: 'var(--tint-2)' }}>
              <div className="card-head">
                <h3>{q.status === 'Expired' ? 'Your quote (expired)' : 'Your quote'}</h3>
                <span className="muted small">Valid until {fmtDate(q.quote.validUntil)}</span>
              </div>
              {q.quote.lines.map((l) => (
                <div key={l.label} className="row between">
                  <span>{l.label}</span>
                  <b>{money(l.amount)}</b>
                </div>
              ))}
              <div className="divider" />
              <div className="row between">
                <b>Total before tax</b>
                <b style={{ fontSize: 20 }}>{money(quoteTotal)}</b>
              </div>
              {q.quote.note && <div className="muted small">{q.quote.note}</div>}
              {q.status === 'Quoted' && (
                <div className="row wrap">
                  <button className="btn btn-secondary btn-sm" onClick={() => setModal('send')}>
                    Change quote
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setModal('withdraw')}>
                    Withdraw quote
                  </button>
                  <span className="grow" />
                  <span className="tiny muted">Demo:</span>
                  <button className="btn btn-primary btn-sm" onClick={accept}>
                    Contractor accepts and pays
                  </button>
                </div>
              )}
            </div>
          )}
          {q.declineReason && (
            <div className="banner danger small">
              <IconX size={18} />
              <div className="grow">
                <b>Declined</b>
                {q.declineReason}
              </div>
            </div>
          )}
        </section>
        <div className="col gap-24">
          <section className="card">
            <h3>Contractor</h3>
            <div className="row">
              <Avatar name={q.contractor} size="lg" />
              <div>
                <div className="strong">{q.contractor}</div>
                <div className="muted small">{q.contactName}</div>
              </div>
            </div>
            <div className="muted small">Contact details are shared once the booking is confirmed. Questions go through the quote.</div>
          </section>
          <section className="card">
            <h3>Your matching equipment</h3>
            <div className="row">
              <img className="thumb" src={img(eq.photo)} alt="" />
              <div>
                <button className="link" style={{ fontSize: 15, fontWeight: 600 }} onClick={() => nav(`/equipment/${eq.id}`)}>
                  {eq.name}
                </button>
                <div className="tiny muted">{eq.pricing ? `${money(eq.pricing.daily)} / day · ${money(eq.pricing.weekly)} / week` : 'No prices set'}</div>
              </div>
            </div>
            {freeUnits.length ? (
              <div className="banner success small">
                <IconCircleCheck size={18} />
                <div className="grow">
                  {freeUnits.length} of {eq.units.length} units free for these dates ({freeUnits.map((u) => '#' + u.id).join(', ')})
                </div>
              </div>
            ) : (
              <div className="banner danger small">
                <IconAlertTriangle size={18} />
                <div className="grow">No units are free for these dates. You can still decline or quote different dates.</div>
              </div>
            )}
            {paused.length > 0 && (
              <div className="banner warning small">
                <IconAlertTriangle size={18} />
                <div className="grow">Bookings are paused: {paused[0].name.toLowerCase()} {paused[0].status.toLowerCase()}. Fix it in Compliance before the contractor can book.</div>
              </div>
            )}
          </section>
        </div>
      </div>
      {modal === 'send' && <SendQuoteModal q={q} days={days} onClose={() => setModal('')} />}
      {modal === 'decline' && (
        <ReasonDialog
          title="Decline this request"
          text={`${q.contractor} will be told straight away so they can look elsewhere.`}
          options={['Not available on those dates', 'Outside our service area', 'Equipment not suitable for this job', 'Other']}
          placeholder="Add a short note for the contractor."
          confirmLabel="Decline request"
          danger
          onConfirm={(r) => update((s) => { const x = s.quotes.find((y) => y.id === q.id)!; x.status = 'Declined'; x.declineReason = r; }, { history: `Declined quote request ${q.id}: ${r}`, toast: 'Request declined. The contractor was told' })}
          onClose={() => setModal('')}
        />
      )}
      {modal === 'withdraw' && (
        <ReasonDialog
          title="Withdraw your quote"
          text="The contractor will no longer be able to accept it."
          confirmLabel="Withdraw quote"
          danger
          onConfirm={(r) => update((s) => { const x = s.quotes.find((y) => y.id === q.id)!; x.status = 'Declined'; x.declineReason = `Quote withdrawn: ${r}`; }, { history: `Withdrew quote ${q.id}: ${r}`, toast: 'Quote withdrawn' })}
          onClose={() => setModal('')}
        />
      )}
    </>
  );
}

function SendQuoteModal({ q, days, onClose }: { q: QuoteRequest; days: number; onClose: () => void }) {
  const { state, update } = useStore();
  const eq = state.equipment.find((e) => e.id === q.equipmentId)!;
  const p = eq.pricing;
  const units = Math.max(1, Number(/(\d+)\s/.exec(q.need)?.[1] ?? 1));
  const [lines, setLines] = useState<QuoteLine[]>(
    q.quote?.lines ?? [
      { label: `${units > 1 ? `${units} × ` : ''}${eq.name}, ${days} days`, amount: p ? priceFor(p, days) * units : 0 },
      { label: 'Delivery and pickup', amount: (p?.deliveryFee ?? 0) * units },
      ...(q.operator ? [{ label: `Certified operator (${days} days)`, amount: days * 480 }] : []),
    ],
  );
  const [valid, setValid] = useState(addDays(TODAY, 5));
  const [note, setNote] = useState(q.quote?.note ?? '');
  const [err, setErr] = useState('');
  const total = lines.reduce((s, l) => s + (l.amount || 0), 0);
  const send = () => {
    if (lines.some((l) => !l.label.trim() || !(l.amount > 0))) return setErr('Every line needs a name and an amount above $0.');
    if (valid <= TODAY) return setErr('The quote must be valid until a future date.');
    update(
      (s) => {
        const x = s.quotes.find((y) => y.id === q.id)!;
        x.status = 'Quoted';
        x.quote = { lines, validUntil: valid, note };
        x.declineReason = undefined;
      },
      { history: `Sent quote ${q.id} to ${q.contractor}: ${money(total)}`, toast: `Quote sent to ${q.contractor}` },
    );
    onClose();
  };
  return (
    <Modal
      title={`Quote for ${q.contractor}`}
      sub={`${q.need} · ${shortDate(q.start)} – ${shortDate(q.end)} (${days} days)`}
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={send}>
            <IconSend size={18} /> Send quote · {money(total)}
          </button>
        </>
      }
    >
      <div className="label">Itemized charges</div>
      {lines.map((l, i) => (
        <div key={i} className="row">
          <input className="input grow" value={l.label} onChange={(e) => setLines(lines.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} aria-label="Line description" />
          <input className="input" style={{ width: 150 }} type="number" value={l.amount || ''} onChange={(e) => setLines(lines.map((x, k) => (k === i ? { ...x, amount: Number(e.target.value) } : x)))} aria-label="Amount" />
          <button className="x-btn" onClick={() => setLines(lines.filter((_, k) => k !== i))} aria-label="Remove line">
            <IconTrash size={18} />
          </button>
        </div>
      ))}
      <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setLines([...lines, { label: '', amount: 0 }])}>
        <IconPlus size={16} /> Add a line
      </button>
      <div className="row between" style={{ background: 'var(--navy-50)', borderRadius: 12, padding: '12px 16px' }}>
        <span>
          Total before tax <span className="tiny muted">· RigSetGo adds tax and its service fee at checkout</span>
        </span>
        <b style={{ fontSize: 20 }}>{money(total)}</b>
      </div>
      <div className="grid g2" style={{ gap: 16 }}>
        <Field label="Valid until" hint="After this date the quote must be checked again.">
          <input className="input" type="date" value={valid} onChange={(e) => setValid(e.target.value)} />
        </Field>
        <Field label="Deposit (held, not charged)">
          <input className="input" disabled value={money(eq.pricing?.deposit ?? 0)} />
        </Field>
      </div>
      <Field label="Message to the contractor (optional)">
        <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Both loaders can be on site by 7 AM Monday." />
      </Field>
      {err && <div className="banner danger small">{err}</div>}
    </Modal>
  );
}
