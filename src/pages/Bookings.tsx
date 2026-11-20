import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { IconArrowLeft, IconSearch, IconCalendarPlus, IconAlertTriangle, IconCash, IconTruckDelivery, IconTool, IconCircleCheck, IconMessageCircle, IconClipboardList, IconBuildingBank } from '@tabler/icons-react';
import { useStore, nowStamp } from '../store/store';
import { Avatar, Badge, ConfirmDialog, Empty, Field, Modal, ReasonDialog, Stars, Tabs } from '../components/ui';
import type { Booking } from '../data/types';
import { TODAY, FEE_RATE } from '../data/seed';
import { bookingTotal, eqName, fmtDate, fmtStamp, money, platformFee, rentalDays, shortDate, supplierShare, unitConflict } from '../data/utils';
import { TicketModal } from './Deliveries';
import { img } from '../data/images';

type BTab = 'All' | 'Needs action' | 'Upcoming' | 'Active' | 'Completed' | 'Cancelled';

export const needsAction = (b: Booking) => b.extension?.status === 'Waiting' || b.extraCharge?.status === 'Needs review' || b.status === 'Pending payment' || b.status === 'Return requested' || b.status === 'Returned';

const inTab = (b: Booking, t: BTab) =>
  t === 'All' ? true : t === 'Needs action' ? needsAction(b) : t === 'Upcoming' ? ['Confirmed', 'Pending payment'].includes(b.status) : t === 'Active' ? ['Out for delivery', 'Active', 'Return requested'].includes(b.status) : t === 'Completed' ? ['Returned', 'Completed'].includes(b.status) : b.status === 'Cancelled';

export function BookingList() {
  const { state } = useStore();
  const nav = useNavigate();
  const [tab, setTab] = useState<BTab>('All');
  const [q, setQ] = useState('');
  const tabs: BTab[] = ['All', 'Needs action', 'Upcoming', 'Active', 'Completed', 'Cancelled'];
  const list = state.bookings
    .filter((b) => inTab(b, tab) && (b.id + b.contractor + eqName(state, b.equipmentId)).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.start.localeCompare(a.start));
  return (
    <>
      <div className="page-head">
        <div>
          <h2 style={{ fontSize: 22 }}>Every rental from start to finish</h2>
          <p>Booking, payment, delivery and return in one place.</p>
        </div>
      </div>
      <section className="card">
        <div className="row between wrap">
          <Tabs tabs={tabs} value={tab} onChange={setTab} counts={Object.fromEntries(tabs.map((t) => [t, state.bookings.filter((b) => inTab(b, t)).length]))} />
          <div className="search" style={{ width: 280 }}>
            <IconSearch size={18} color="var(--muted)" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Booking number or contractor" aria-label="Search bookings" />
          </div>
        </div>
        {list.length === 0 ? (
          <Empty title="No bookings here" text="Try another tab or search." icon={<IconClipboardList size={28} />} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Contractor</th>
                  <th>Equipment</th>
                  <th>Dates</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((b) => (
                  <tr key={b.id} className="click" onClick={() => nav(`/bookings/${b.id}`)}>
                    <td>
                      <div className="strong">{b.id}</div>
                      {needsAction(b) && <span className="badge b-orange" style={{ marginTop: 4 }}>Needs action</span>}
                    </td>
                    <td>
                      <div className="row">
                        <Avatar name={b.contractor} size="sm" />
                        {b.contractor}
                      </div>
                    </td>
                    <td>
                      <div>{eqName(state, b.equipmentId)}</div>
                      <div className="tiny muted">Unit #{b.unitId}</div>
                    </td>
                    <td>
                      {shortDate(b.start)} – {shortDate(b.extension?.status === 'Accepted' ? b.extension.newEnd : b.end)}
                    </td>
                    <td className="strong">{money(bookingTotal(b))}</td>
                    <td>
                      <Badge>{b.payment}</Badge>
                    </td>
                    <td>
                      <Badge>{b.status}</Badge>
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

export function BookingDetail() {
  const { id } = useParams();
  const { state, update, toast } = useStore();
  const nav = useNavigate();
  const b = state.bookings.find((x) => x.id === id);
  const [modal, setModal] = useState<'' | 'cancel' | 'declineExt' | 'dropCharge' | 'breakdown' | 'complete' | 'ticket' | 'pickup' | 'approveCharge'>('');
  const [swapUnit, setSwapUnit] = useState('');
  const [breakdownNote, setBreakdownNote] = useState('');
  if (!b) return <Empty title="Booking not found" action={<Link className="btn btn-secondary" to="/bookings">Back to bookings</Link>} />;
  const eq = state.equipment.find((e) => e.id === b.equipmentId)!;
  const jobs = state.jobs.filter((j) => j.bookingId === b.id);
  const cases = state.cases.filter((c) => c.bookingId === b.id);
  const end = b.extension?.status === 'Accepted' ? b.extension.newEnd : b.end;
  const days = rentalDays(b.start, end);
  const mutate = (fn: (x: Booking) => void, history: string, toastText: string, tone?: 'success' | 'warning' | 'info') =>
    update(
      (s) => {
        const x = s.bookings.find((y) => y.id === b.id)!;
        fn(x);
        x.timeline.push({ time: nowStamp(), text: history });
      },
      { history: `${b.id}: ${history}`, toast: toastText, tone },
    );
  const freeSwap = eq.units.filter((u) => u.id !== b.unitId && !unitConflict(state, eq.id, u.id, TODAY, end));
  const deliveryJob = jobs.find((j) => j.type === 'Delivery' && j.status !== 'Done');
  const pickupJob = jobs.find((j) => j.type === 'Pickup' && j.status !== 'Done');

  return (
    <>
      <button className="back" onClick={() => nav('/bookings')}>
        <IconArrowLeft size={16} /> All bookings
      </button>

      {b.status === 'Pending payment' && (
        <div className="banner warning">
          <IconBuildingBank size={20} />
          <div className="grow">
            <b>Waiting for the bank transfer</b>Bank transfers (ACH) can take 2 to 4 business days. The machine is held for this booking until the payment provider confirms.
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() =>
              update(
                (s) => {
                  const x = s.bookings.find((y) => y.id === b.id)!;
                  x.payment = 'Paid';
                  x.status = 'Confirmed';
                  x.timeline.push({ time: nowStamp(), text: 'Stripe confirmed the bank transfer. Booking confirmed' });
                  if (x.fulfillment === 'delivery' && !s.jobs.some((j) => j.bookingId === x.id))
                    s.jobs.push({ id: `JOB-${400 + s.jobs.length}`, bookingId: x.id, type: 'Delivery', date: x.start, window: '7:00 – 9:00 AM', driverId: null, status: 'Needs driver', progress: 0, distance: 10 });
                },
                { history: `${b.id}: bank transfer confirmed`, notify: { text: `Payment confirmed for ${b.id}`, link: `/bookings/${b.id}` }, toast: 'Payment confirmed. Booking is confirmed' },
              )
            }
          >
            Demo: bank confirms payment
          </button>
        </div>
      )}
      {b.extension?.status === 'Waiting' && (
        <div className="banner info">
          <IconCalendarPlus size={20} />
          <div className="grow">
            <b>{b.contactName} wants to extend until {fmtDate(b.extension.newEnd)}</b>
            Extra charge {money(b.extension.extra)}. We checked: unit #{b.unitId} is {unitConflict(state, eq.id, b.unitId, addOne(b.end), b.extension.newEnd, b.id) ? 'NOT free' : 'free'} for those days.
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal('declineExt')}>
            Decline
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              const c = unitConflict(state, eq.id, b.unitId, addOne(b.end), b.extension!.newEnd, b.id);
              if (c) return toast(`Cannot extend: ${c}`, 'warning');
              mutate((x) => (x.extension!.status = 'Accepted'), `Extension to ${shortDate(b.extension!.newEnd)} accepted. ${money(b.extension!.extra)} charged`, 'Extension accepted. The contractor was charged');
            }}
          >
            Accept extension
          </button>
        </div>
      )}
      {b.extraCharge?.status === 'Needs review' && (
        <div className="banner warning">
          <IconCash size={20} />
          <div className="grow">
            <b>Extra charge to review: {money(b.extraCharge.amount)}</b>
            {b.extraCharge.reason}. Evidence is on the return ticket. The contractor is told before anything is charged.
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal('dropCharge')}>
            Drop charge
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setModal('approveCharge')}>
            Approve and notify
          </button>
        </div>
      )}

      <div className="grid g-main">
        <div className="col gap-24">
          <section className="card">
            <div className="row between top">
              <div className="row gap-16">
                <img className="thumb" src={img(eq.photo)} alt="" style={{ width: 96, height: 72 }} />
                <div>
                  <div className="row gap-8">
                    <Badge>{b.status}</Badge>
                    <span className="muted small">{b.id}</span>
                  </div>
                  <h2 style={{ fontSize: 22, marginTop: 6 }}>
                    {eq.name} · Unit #{b.unitId}
                  </h2>
                  <div className="muted small">
                    {fmtDate(b.start)} – {fmtDate(end)} · {days} days
                  </div>
                </div>
              </div>
              <div className="row wrap" style={{ justifyContent: 'flex-end' }}>
                {['Confirmed', 'Pending payment'].includes(b.status) && (
                  <button className="btn btn-secondary" onClick={() => setModal('cancel')}>
                    Cancel booking
                  </button>
                )}
                {b.status === 'Confirmed' && deliveryJob && (
                  <button className="btn btn-primary" onClick={() => nav(`/deliveries/${deliveryJob.id}`)}>
                    <IconTruckDelivery size={18} /> Plan delivery
                  </button>
                )}
                {b.status === 'Confirmed' && b.fulfillment === 'pickup' && (
                  <button className="btn btn-primary" onClick={() => setModal('ticket')}>
                    Record yard handover
                  </button>
                )}
                {b.status === 'Out for delivery' && deliveryJob && (
                  <button className="btn btn-primary" onClick={() => nav(`/deliveries/${deliveryJob.id}`)}>
                    Track delivery
                  </button>
                )}
                {b.status === 'Active' && (
                  <>
                    <button className="btn btn-secondary" onClick={() => setModal('breakdown')}>
                      <IconTool size={18} /> Report breakdown
                    </button>
                    <button className="btn btn-primary" onClick={() => setModal(b.fulfillment === 'delivery' ? 'pickup' : 'ticket')}>
                      {b.fulfillment === 'delivery' ? 'Schedule pickup' : 'Record return at yard'}
                    </button>
                  </>
                )}
                {b.status === 'Return requested' && pickupJob && (
                  <button className="btn btn-primary" onClick={() => nav(`/deliveries/${pickupJob.id}`)}>
                    Go to pickup job
                  </button>
                )}
                {b.status === 'Returned' && (
                  <button className="btn btn-primary" disabled={b.extraCharge?.status === 'Needs review'} onClick={() => setModal('complete')}>
                    <IconCircleCheck size={18} /> Complete rental
                  </button>
                )}
              </div>
            </div>
            <div className="grid g3" style={{ gap: 12 }}>
              {[
                ['Fulfillment', b.fulfillment === 'delivery' ? 'Delivery to jobsite' : 'Customer pickup at yard'],
                ['Jobsite', b.jobsite],
                ['Site contact', b.siteContact],
                ['PO number', b.poNumber || '—'],
                ['Payment method', b.paymentMethod],
                ['Policies', 'Rental and cancellation policy saved at booking'],
              ].map(([l, v]) => (
                <div key={l} className="stat">
                  <span className="label">{l}</span>
                  <span className="strong small">{v}</span>
                </div>
              ))}
            </div>
            {b.cancelReason && (
              <div className="banner danger small">
                <b>Cancelled:</b> {b.cancelReason}
              </div>
            )}
          </section>
          <section className="card">
            <div className="card-head">
              <h3>Deliveries and tickets</h3>
            </div>
            {jobs.length === 0 && <div className="muted small">{b.fulfillment === 'pickup' ? 'The contractor collects from your yard. Record the handover when they arrive.' : 'A delivery job is created when the booking is confirmed.'}</div>}
            {jobs.map((j) => {
              const d = state.members.find((m) => m.id === j.driverId);
              return (
                <button key={j.id} className="row between" style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 14, padding: 14, cursor: 'pointer', textAlign: 'left' }} onClick={() => nav(`/deliveries/${j.id}`)}>
                  <div className="row">
                    <span className="icon-circle">
                      <IconTruckDelivery size={18} />
                    </span>
                    <div>
                      <div className="strong">
                        {j.type} · {fmtDate(j.date)}
                      </div>
                      <div className="tiny muted">
                        {j.window} · {d ? d.name : 'No driver yet'}
                        {j.ticket ? ` · Ticket signed by ${j.ticket.signedBy}` : ''}
                      </div>
                    </div>
                  </div>
                  <Badge>{j.status}</Badge>
                </button>
              );
            })}
          </section>
          <section className="card">
            <div className="card-head">
              <h3>History</h3>
            </div>
            <div className="timeline">
              {[...b.timeline].reverse().map((t, i) => (
                <div key={i} className="t">
                  <i />
                  <div>
                    <div className="small strong">{t.text}</div>
                    <div className="tiny muted">{fmtStamp(t.time)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        <div className="col gap-24">
          <section className="card">
            <h3>Contractor</h3>
            <div className="row">
              <Avatar name={b.contractor} size="lg" />
              <div>
                <div className="strong">{b.contractor}</div>
                <div className="muted small">{b.contactName}</div>
                <span className="row gap-4 small">
                  <Stars value={b.rating} /> {b.rating}
                </span>
              </div>
            </div>
          </section>
          <section className="card">
            <div className="card-head">
              <h3>Money</h3>
              <Badge>{b.payment}</Badge>
            </div>
            {[
              ['Rental', b.rental],
              ['Delivery and pickup', b.deliveryFee],
              ...(b.extension?.status === 'Accepted' ? [['Extension', b.extension.extra] as [string, number]] : []),
              ...(b.extraCharge?.status === 'Approved' ? [['Extra charge (damage / fuel)', b.extraCharge.amount] as [string, number]] : []),
              ['Tax', b.tax],
            ].map(([l, v]) => (
              <div key={String(l)} className="row between small">
                <span className="muted">{l}</span>
                <span>{money(Number(v))}</span>
              </div>
            ))}
            <div className="divider" />
            <div className="row between">
              <b>Contractor paid</b>
              <b style={{ fontSize: 20 }}>{money(bookingTotal(b))}</b>
            </div>
            <div className="row between small">
              <span className="muted">RigSetGo fee ({Math.round(FEE_RATE * 100)}%)</span>
              <span>− {money(platformFee(b))}</span>
            </div>
            <div className="row between">
              <b>Your share</b>
              <b style={{ color: 'var(--navy)' }}>{money(b.status === 'Cancelled' ? 0 : supplierShare(b))}</b>
            </div>
            <div className="banner info small">
              <div className="grow">
                Deposit held separately: <b>{money(b.deposit)}</b>. It is not your earnings. It is returned or used for approved damage.
              </div>
            </div>
          </section>
          <section className="card">
            <div className="card-head">
              <h3>Support cases</h3>
              <button className="link" onClick={() => nav(`/support?new=1&booking=${b.id}`)}>
                Open a case
              </button>
            </div>
            {cases.length === 0 && <div className="muted small">No cases on this booking.</div>}
            {cases.map((c) => (
              <button key={c.id} className="row between" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }} onClick={() => nav(`/support/${c.id}`)}>
                <span className="row gap-8 small">
                  <IconMessageCircle size={16} /> {c.subject}
                </span>
                <Badge>{c.status}</Badge>
              </button>
            ))}
          </section>
        </div>
      </div>

      {modal === 'cancel' && (
        <ReasonDialog
          title="Cancel this booking?"
          text={`${b.contractor} gets a full refund and is offered similar machines. Cancelling often hurts your rating.`}
          options={['Machine broke down', 'Machine not available', 'Delivery not possible', 'Other']}
          confirmLabel="Cancel booking and refund"
          danger
          onConfirm={(r) =>
            update(
              (s) => {
                const x = s.bookings.find((y) => y.id === b.id)!;
                x.status = 'Cancelled';
                x.payment = x.payment === 'Pending' ? 'Pending' : 'Refunded';
                x.cancelReason = `Cancelled by supplier: ${r}`;
                x.timeline.push({ time: nowStamp(), text: `Cancelled by Mark Rivera (${r}). Contractor refunded` });
                s.jobs = s.jobs.filter((j) => j.bookingId !== x.id || j.status === 'Done');
              },
              { history: `Cancelled ${b.id}: ${r}`, notify: { text: `${b.id} was cancelled and ${b.contractor} was refunded`, link: `/bookings/${b.id}` }, toast: 'Booking cancelled. The contractor was refunded', tone: 'warning' },
            )
          }
          onClose={() => setModal('')}
        />
      )}
      {modal === 'declineExt' && (
        <ReasonDialog
          title="Decline the extension"
          text="The original return date stays the same."
          confirmLabel="Decline extension"
          danger
          onConfirm={(r) => mutate((x) => { x.extension!.status = 'Declined'; x.extension!.reason = r; }, `Extension declined: ${r}`, 'Extension declined. The contractor was told', 'warning')}
          onClose={() => setModal('')}
        />
      )}
      {modal === 'approveCharge' && (
        <ConfirmDialog
          title={`Charge ${money(b.extraCharge!.amount)}?`}
          text={`${b.contractor} will see the photos and the reason. The charge follows the rental policy they accepted at booking.`}
          confirmLabel="Approve and notify contractor"
          onConfirm={() => mutate((x) => (x.extraCharge!.status = 'Approved'), `Extra charge of ${money(b.extraCharge!.amount)} approved and contractor notified`, 'Extra charge approved. The contractor was notified')}
          onClose={() => setModal('')}
        />
      )}
      {modal === 'dropCharge' && (
        <ReasonDialog
          title="Drop the extra charge"
          text="Nothing extra will be charged."
          confirmLabel="Drop charge"
          onConfirm={(r) => mutate((x) => (x.extraCharge!.status = 'Dropped'), `Extra charge dropped: ${r}`, 'Extra charge dropped')}
          onClose={() => setModal('')}
        />
      )}
      {modal === 'complete' && (
        <ConfirmDialog
          title="Complete this rental?"
          text={`The deposit of ${money(b.deposit)} goes back to ${b.contractor}, and your share of ${money(supplierShare(b))} is added to the next payout.`}
          confirmLabel="Complete rental"
          onConfirm={() => mutate((x) => (x.status = 'Completed'), 'Rental completed. Deposit returned', 'Rental completed. Your share is added to the next payout')}
          onClose={() => setModal('')}
        />
      )}
      {modal === 'pickup' && (
        <ConfirmDialog
          title="Schedule the pickup?"
          text={`A pickup job for ${fmtDate(end)} is created. Assign a driver on the Deliveries page.`}
          confirmLabel="Create pickup job"
          onConfirm={() => {
            const jid = `JOB-${400 + state.jobs.length}`;
            update(
              (s) => {
                const x = s.bookings.find((y) => y.id === b.id)!;
                x.status = 'Return requested';
                x.timeline.push({ time: nowStamp(), text: `Pickup scheduled for ${shortDate(end)}` });
                s.jobs.push({ id: jid, bookingId: b.id, type: 'Pickup', date: end, window: '1:00 – 3:00 PM', driverId: null, status: 'Needs driver', progress: 0, distance: 12 });
              },
              { history: `${b.id}: pickup scheduled`, toast: 'Pickup job created' },
            );
            nav(`/deliveries/${jid}`);
          }}
          onClose={() => setModal('')}
        />
      )}
      {modal === 'breakdown' && (
        <Modal
          title="Report a breakdown"
          sub="A support case is opened so RigSetGo can help both sides."
          onClose={() => setModal('')}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModal('')}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (breakdownNote.trim().length < 5) return toast('Please describe the problem', 'warning');
                  const cid = `CASE-${330 + state.cases.length}`;
                  update(
                    (s) => {
                      const x = s.bookings.find((y) => y.id === b.id)!;
                      x.timeline.push({ time: nowStamp(), text: `Breakdown reported: ${breakdownNote}${swapUnit ? `. Swap to unit #${swapUnit} offered, contractor agreed` : '. Repair visit planned'}` });
                      if (swapUnit) x.unitId = swapUnit;
                      s.cases.unshift({ id: cid, bookingId: b.id, category: 'Breakdown', subject: `Breakdown on ${eq.name}`, status: 'Open', created: nowStamp(), messages: [{ from: 'You', text: breakdownNote + (swapUnit ? ` We are swapping to unit #${swapUnit}.` : ' A mechanic is on the way.'), time: nowStamp() }] });
                    },
                    { history: `${b.id}: breakdown reported (${cid})`, toast: swapUnit ? `Swap to unit #${swapUnit} recorded and case opened` : 'Breakdown reported and case opened' },
                  );
                  setModal('');
                  setBreakdownNote('');
                }}
              >
                Report breakdown
              </button>
            </>
          }
        >
          <Field label="What happened?">
            <textarea className="textarea" value={breakdownNote} onChange={(e) => setBreakdownNote(e.target.value)} placeholder="e.g. Hydraulic hose burst on the boom." />
          </Field>
          <Field label="What will you do?" hint="A swap machine needs the contractor’s yes. In this demo we assume they agreed.">
            <select className="select" value={swapUnit} onChange={(e) => setSwapUnit(e.target.value)}>
              <option value="">Send a mechanic to repair it</option>
              {freeSwap.map((u) => (
                <option key={u.id} value={u.id}>
                  Swap to unit #{u.id} (free until {shortDate(end)})
                </option>
              ))}
            </select>
          </Field>
          {freeSwap.length === 0 && (
            <div className="banner warning small">
              <IconAlertTriangle size={18} />
              <div className="grow">No other unit is free for the rest of this rental.</div>
            </div>
          )}
        </Modal>
      )}
      {modal === 'ticket' && (
        <TicketModal
          bookingId={b.id}
          kind={b.status === 'Active' ? 'Pickup' : 'Delivery'}
          onClose={() => setModal('')}
        />
      )}
    </>
  );
}

function addOne(d: string) {
  const x = new Date(d + 'T12:00');
  x.setDate(x.getDate() + 1);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}
