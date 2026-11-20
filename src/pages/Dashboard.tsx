import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconRoute, IconClock, IconAlertTriangle, IconFileText, IconCalendar, IconUpload, IconArrowRight, IconChevronDown, IconCash, IconClipboardCheck, IconTruckDelivery } from '@tabler/icons-react';
import { useStore } from '../store/store';
import { Avatar, Badge, Empty, Pills, Progress, Stars } from '../components/ui';
import { Bars, Donut, LineChart, MiniLine, RouteMap } from '../components/charts';
import { TODAY } from '../data/seed';
import { addDays, bookingTotal, eqName, fleetStats, fmtDate, fmtStamp, money, monthEarnings, overlaps, rentalDays, shortDate, LIVE_STATUSES, daysUntil } from '../data/utils';
import { img } from '../data/images';

export default function Dashboard() {
  const { state } = useStore();
  const nav = useNavigate();
  const [tab, setTab] = useState<'On the way' | 'Scheduled' | 'Delivered'>('On the way');
  const [range, setRange] = useState<'Last 7 days' | 'Last 30 days'>('Last 7 days');
  const [month, setMonth] = useState<'November' | 'October'>('November');

  const jobs = state.jobs.filter((j) => (tab === 'On the way' ? j.status === 'On the way' : tab === 'Scheduled' ? j.status === 'Scheduled' || j.status === 'Needs driver' : j.status === 'Done'));
  const job = jobs[0];
  const jobBooking = job && state.bookings.find((b) => b.id === job.bookingId);

  const activeBookings = state.bookings.filter((b) => ['Active', 'Out for delivery', 'Return requested', 'Confirmed'].includes(b.status));
  const [spotId, setSpotId] = useState(() => activeBookings.find((b) => b.extension?.status === 'Waiting')?.id ?? activeBookings[0]?.id);
  const spot = state.bookings.find((b) => b.id === spotId) ?? activeBookings[0];

  const alerts = useMemo(() => {
    const out: { icon: 'alert' | 'file' | 'cash' | 'cal'; title: string; text: string; to: string; action: string }[] = [];
    state.docs.filter((d) => d.status === 'Expired' || d.status === 'Rejected').forEach((d) => out.push({ icon: 'alert', title: `${d.name} ${d.status.toLowerCase()}`, text: `${d.covers}. New bookings are paused until you upload a new one.`, to: '/compliance', action: 'Upload document' }));
    state.docs.filter((d) => d.status === 'Expiring soon').forEach((d) => out.push({ icon: 'alert', title: `${d.name} expires in ${daysUntil(d.expires)} days`, text: `${d.covers}. Upload the new one to keep it bookable.`, to: '/compliance', action: 'Upload document' }));
    state.bookings.filter((b) => b.extension?.status === 'Waiting').forEach((b) => out.push({ icon: 'cal', title: 'Extension request', text: `${b.contractor} wants ${b.id} until ${shortDate(b.extension!.newEnd)}.`, to: `/bookings/${b.id}`, action: 'Review request' }));
    state.bookings.filter((b) => b.extraCharge?.status === 'Needs review').forEach((b) => out.push({ icon: 'cash', title: 'Extra charge to review', text: `${b.id}: ${money(b.extraCharge!.amount)} for damage or fuel.`, to: `/bookings/${b.id}`, action: 'Review charge' }));
    state.quotes.filter((q) => q.status === 'New').forEach((q) => out.push({ icon: 'file', title: 'New quote request', text: `${q.contractor} needs ${q.need.toLowerCase()}.`, to: `/quotes/${q.id}`, action: 'Send a quote' }));
    state.payouts.filter((p) => p.status === 'Failed').forEach((p) => out.push({ icon: 'cash', title: 'Payout failed', text: `${money(p.amount)} could not be sent. Check your bank details.`, to: '/earnings', action: 'Fix payout' }));
    return out;
  }, [state]);

  const fleet = fleetStats(state);
  const earnings = month === 'November' ? monthEarnings(state) : monthEarnings(state, '2026-10');
  const nextPayout = state.payouts.filter((p) => p.status === 'Scheduled').sort((a, b) => a.date.localeCompare(b.date))[0];

  const days7 = Array.from({ length: 7 }, (_, i) => addDays(TODAY, i - 6));
  const trend = range === 'Last 7 days'
    ? { values: days7.map((d) => state.bookings.filter((b) => b.status !== 'Cancelled' && overlaps(d, d, b.start, b.end)).length), labels: days7.map(shortDate) }
    : { values: [4, 5, 7, 6, 8, 9, 7, 8].map((v, i) => (i === 7 ? state.bookings.filter((b) => LIVE_STATUSES.includes(b.status)).length : v)), labels: ['Oct 1', 'Oct 5', 'Oct 10', 'Oct 15', 'Oct 20', 'Oct 25', 'Nov 1', 'Today'] };
  const dayBars = days7.map((d) => state.bookings.filter((b) => b.status !== 'Cancelled' && overlaps(d, d, b.start, b.end)).length);
  const daysBooked = state.bookings.filter((b) => b.status !== 'Cancelled').reduce((sum, b) => {
    let n = 0;
    days7.forEach((d) => overlaps(d, d, b.start, b.end) && n++);
    return sum + n;
  }, 0);

  const statusGroups = [
    { label: 'Active', value: state.bookings.filter((b) => ['Active', 'Out for delivery', 'Return requested'].includes(b.status)).length, color: '#003778' },
    { label: 'Upcoming', value: state.bookings.filter((b) => b.status === 'Confirmed').length, color: '#4C7DC4' },
    { label: 'Awaiting payment', value: state.bookings.filter((b) => b.status === 'Pending payment').length, color: '#A8C2E6' },
    { label: 'Completed', value: state.bookings.filter((b) => b.status === 'Completed' || b.status === 'Returned').length, color: '#7FA6D6' },
    { label: 'Cancelled', value: state.bookings.filter((b) => b.status === 'Cancelled').length, color: '#F7941D' },
  ];
  const statusTotal = statusGroups.reduce((s, x) => s + x.value, 0);
  const newQuotes = state.quotes.filter((q) => q.status === 'New');
  const spotDays = spot ? rentalDays(spot.start, spot.end) : 0;
  const spotLeft = spot ? Math.max(0, rentalDays(TODAY, spot.end)) : 0;
  const spotUsed = spot ? Math.min(100, Math.round(((spotDays - Math.min(spotDays, spotLeft)) / spotDays) * 100)) : 0;
  const eqPhoto = state.equipment.find((e) => e.id === 'EQ-101')?.photo ?? 'images/excavator-dusk.jpg';

  return (
    <>
      {/* Live delivery */}
      <section className="card" style={{ flexDirection: 'row', gap: 24, alignItems: 'stretch' }} aria-label="Live delivery">
        <div className="col gap-16" style={{ width: 320, flex: 'none' }}>
          <Pills items={['On the way', 'Scheduled', 'Delivered'] as const} value={tab} onChange={setTab} />
          {job && jobBooking ? (
            <>
              <div>
                <div className="muted small strong">{tab === 'Delivered' ? 'Delivered' : 'Delivery progress'}</div>
                <div className="tiny muted">
                  {job.bookingId} · {eqName(state, jobBooking.equipmentId)} · {job.type}
                </div>
              </div>
              <div className="big-num" style={{ fontSize: 48 }}>
                {job.progress}
                <small>%</small>
              </div>
              <Progress value={job.progress} />
              <div className="grid g2" style={{ gap: 12 }}>
                <div className="stat">
                  <span className="label row gap-4">
                    <IconRoute size={16} color="var(--navy)" /> Distance left
                  </span>
                  <span className="value" style={{ color: 'var(--navy)' }}>
                    {Math.round(job.distance * (1 - job.progress / 100))} mi
                  </span>
                </div>
                <div className="stat">
                  <span className="label row gap-4">
                    <IconClock size={16} color="var(--navy)" /> {job.status === 'Done' ? 'Finished' : job.status === 'On the way' ? 'Arrives in' : 'Window'}
                  </span>
                  <span className="value" style={{ color: 'var(--navy)', fontSize: job.status === 'On the way' ? 24 : 15 }}>
                    {job.status === 'On the way' ? `${Math.max(1, Math.round(job.distance * (1 - job.progress / 100) * 1.4))} min` : job.status === 'Done' ? shortDate(job.date) : job.window}
                  </span>
                </div>
              </div>
              <button className="btn btn-secondary" onClick={() => nav(`/deliveries/${job.id}`)}>
                Open tracking
              </button>
            </>
          ) : (
            <Empty title={`Nothing ${tab.toLowerCase()}`} text="Deliveries and pickups will show here." icon={<IconTruckDelivery size={28} />} />
          )}
        </div>
        <div className="grow" style={{ cursor: job ? 'pointer' : 'default' }} onClick={() => job && nav(`/deliveries/${job.id}`)}>
          <RouteMap progress={job?.progress ?? 0} label={jobBooking ? `${job.status === 'Done' ? 'Delivered' : 'On time'} · ${jobBooking.jobsite.split(',')[0]}` : undefined} height={300} />
        </div>
        <div className="card" style={{ width: 300, flex: 'none', boxShadow: 'var(--shadow)', padding: 20, gap: 14 }}>
          <div className="card-head">
            <h3 style={{ fontSize: 16 }}>Alerts</h3>
            <span className="badge b-orange">{alerts.length}</span>
          </div>
          {alerts.length === 0 && <div className="muted small">No alerts. Everything is up to date.</div>}
          {alerts.slice(0, 3).map((a, i) => (
            <button key={i} className="row top" style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }} onClick={() => nav(a.to)}>
              <span className={`icon-circle ${a.icon === 'alert' ? 'orange' : ''}`} style={{ width: 36, height: 36 }}>
                {a.icon === 'alert' ? <IconAlertTriangle size={18} /> : a.icon === 'file' ? <IconFileText size={18} /> : a.icon === 'cal' ? <IconCalendar size={18} /> : <IconCash size={18} />}
              </span>
              <span className="grow">
                <div className="strong small">{a.title}</div>
                <div className="tiny muted">{a.text}</div>
              </span>
            </button>
          ))}
          {alerts[0] && (
            <button className="btn btn-primary btn-block" style={{ marginTop: 'auto' }} onClick={() => nav(alerts[0].to)}>
              {alerts[0].action} {alerts[0].action.startsWith('Upload') ? <IconUpload size={16} /> : <IconArrowRight size={16} />}
            </button>
          )}
        </div>
      </section>

      {/* Booking details + Fleet */}
      <div className="grid g-main">
        <section className="card">
          <div className="card-head">
            <h2>Booking details</h2>
            <div className="row">
              {activeBookings.length > 1 && (
                <select className="select" style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }} value={spot?.id} onChange={(e) => setSpotId(e.target.value)} aria-label="Choose booking">
                  {activeBookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id} · {b.contractor}
                    </option>
                  ))}
                </select>
              )}
              {spot && (
                <button className="link" onClick={() => nav(`/bookings/${spot.id}`)}>
                  View booking
                </button>
              )}
            </div>
          </div>
          {spot ? (
            <>
              <div className="row between">
                <div className="row gap-16">
                  <Avatar name={spot.contractor} size="lg" />
                  <div>
                    <div className="strong" style={{ fontSize: 18 }}>{spot.contractor}</div>
                    <div className="muted small">
                      {spot.id} · {eqName(state, spot.equipmentId)} · Unit #{spot.unitId}
                    </div>
                    <div className="muted small">Jobsite: {spot.jobsite}</div>
                  </div>
                </div>
                <div className="col" style={{ alignItems: 'flex-end' }}>
                  <span className="muted small">Contractor rating</span>
                  <span className="row gap-4">
                    <Stars value={spot.rating} size={18} /> <b>{spot.rating}</b>
                  </span>
                </div>
              </div>
              <div className="grid g4" style={{ gap: 0, border: '1px solid var(--line)', borderRadius: 16 }}>
                <div className="col" style={{ padding: 18 }}>
                  <span className="muted small">Days left</span>
                  <span className="big-num" style={{ color: 'var(--navy)' }}>
                    {spot.status === 'Confirmed' ? spotDays : spotLeft} <small className="muted" style={{ fontSize: 14 }}>days</small>
                  </span>
                  <span className="tiny muted">of {spotDays} rental days</span>
                </div>
                <div className="col" style={{ padding: 18, borderLeft: '1px solid var(--line)' }}>
                  <span className="muted small">Rental used</span>
                  <Donut size={86} segments={[{ value: spot.status === 'Confirmed' ? 0 : spotUsed, color: '#003778' }, { value: 100 - (spot.status === 'Confirmed' ? 0 : spotUsed), color: 'transparent' }]} center={`${spot.status === 'Confirmed' ? 0 : spotUsed}%`} />
                </div>
                <div className="col" style={{ padding: 18, borderLeft: '1px solid var(--line)' }}>
                  <span className="muted small">Return date</span>
                  <IconCalendar size={22} color="var(--navy)" />
                  <span className="strong">{fmtDate(spot.extension?.status === 'Accepted' ? spot.extension.newEnd : spot.end)}</span>
                  <span className="tiny muted">{spot.fulfillment === 'delivery' ? 'Pickup by our driver' : 'Returned to the yard'}</span>
                </div>
                <div className="col" style={{ padding: 18, borderLeft: '1px solid var(--line)' }}>
                  <span className="muted small">Status</span>
                  <Badge>{spot.status}</Badge>
                  <span className="tiny muted">Next step</span>
                  <span className="small strong">
                    {spot.extension?.status === 'Waiting' ? 'Answer extension request' : spot.status === 'Confirmed' ? 'Deliver on ' + shortDate(spot.start) : spot.status === 'Return requested' ? 'Pickup by dispatcher' : spot.status === 'Out for delivery' ? 'Record handover' : 'Pickup on ' + shortDate(spot.end)}
                  </span>
                </div>
              </div>
              <div className="row between" style={{ border: '1px solid var(--line)', borderRadius: 16, padding: '16px 20px' }}>
                <div>
                  <div className="muted small">Booking total</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{money(bookingTotal(spot))}</div>
                </div>
                <div>
                  <div className="muted small">Deposit held</div>
                  <div className="strong" style={{ fontSize: 18 }}>{money(spot.deposit)}</div>
                </div>
                <div className="row">
                  <span className="muted small">Payment</span>
                  <Badge>{spot.payment}</Badge>
                </div>
              </div>
            </>
          ) : (
            <Empty title="No active bookings" text="When contractors book your equipment, the details show here." />
          )}
        </section>
        <section className="card">
          <div className="card-head">
            <h2>Fleet utilization</h2>
            <button className="link" onClick={() => nav('/equipment')}>
              View equipment
            </button>
          </div>
          <div className="hero-photo" style={{ height: 180 }}>
            <img src={img(eqPhoto)} alt="CAT 320 excavator" />
          </div>
          <div>
            <div className="big-num">
              {fleet.pct}
              <small>%</small>
            </div>
            <div className="muted small">Units on rent right now</div>
          </div>
          <Progress value={fleet.pct} />
          <div className="divider" />
          <div className="grid g3" style={{ gap: 12 }}>
            {[
              ['On rent', fleet.onRent],
              ['Available', fleet.available],
              ['Maintenance', fleet.maintenance],
            ].map(([l, v]) => (
              <div key={String(l)}>
                <div className="tiny muted">{l}</div>
                <div className="strong" style={{ fontSize: 20 }}>{v}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Trend + earnings */}
      <div className="grid g-wide">
        <section className="card">
          <div className="card-head">
            <h2>Bookings trend</h2>
            <div className="row">
              <span className="muted tiny">Machines on rent per day</span>
              <select className="select" style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }} value={range} onChange={(e) => setRange(e.target.value as typeof range)} aria-label="Date range">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
              </select>
            </div>
          </div>
          <LineChart values={trend.values} labels={trend.labels} />
        </section>
        <section className="card navy" style={{ justifyContent: 'space-between' }}>
          <div className="card-head">
            <h3 style={{ fontSize: 16 }}>Earnings this month</h3>
            <label className="row gap-4" style={{ border: '1px solid rgba(255,255,255,.3)', borderRadius: 999, padding: '4px 12px', fontSize: 12.5 }}>
              <select value={month} onChange={(e) => setMonth(e.target.value as typeof month)} style={{ background: 'transparent', border: 'none', color: '#fff', appearance: 'none', cursor: 'pointer' }} aria-label="Month">
                <option style={{ color: '#000' }}>November</option>
                <option style={{ color: '#000' }}>October</option>
              </select>
              <IconChevronDown size={14} />
            </label>
          </div>
          <div className="row between">
            <div className="col gap-4">
              <div style={{ fontSize: 40, fontWeight: 700 }}>{money(earnings)}</div>
              <div className="small" style={{ color: 'var(--on-navy-muted)' }}>Your share after RigSetGo fees</div>
              <span className="badge" style={{ background: 'rgba(255,255,255,.1)', color: '#9fe7bf', alignSelf: 'flex-start' }}>
                {month === 'November' ? '+12% vs October' : '−4% vs September'}
              </span>
            </div>
            <MiniLine values={month === 'November' ? [30, 52, 44, 70, 62, 88] : [40, 35, 55, 48, 60, 58]} />
          </div>
          <div className="row between">
            <div>
              <div className="tiny" style={{ color: 'var(--on-navy-muted)' }}>Next payout · {nextPayout ? shortDate(nextPayout.date) : '—'}</div>
              <div className="strong" style={{ fontSize: 18 }}>{nextPayout ? money(nextPayout.amount) : 'None scheduled'}</div>
            </div>
            <button className="btn btn-white" onClick={() => nav('/earnings')}>
              View payouts <IconArrowRight size={16} />
            </button>
          </div>
        </section>
      </div>

      {/* Bottom row */}
      <div className="grid g3">
        <section className="card">
          <div className="card-head">
            <h2>Booking status</h2>
            <button className="link" onClick={() => nav('/bookings')}>
              View all
            </button>
          </div>
          <div className="row gap-24">
            <Donut segments={statusGroups} center={String(statusTotal)} sub="bookings" />
            <div className="col gap-8 grow">
              {statusGroups.map((g) => (
                <div key={g.label} className="row gap-8 small">
                  <span style={{ width: 10, height: 10, borderRadius: 5, background: g.color, flex: 'none' }} />
                  <span className="grow">{g.label}</span>
                  <b>{g.value}</b>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="card">
          <div className="card-head">
            <h2>Rental days booked</h2>
            <span className="muted tiny">Last 7 days</span>
          </div>
          <div className="row gap-8" style={{ alignItems: 'baseline' }}>
            <span className="big-num" style={{ fontSize: 30 }}>{daysBooked}</span>
            <span className="muted">days</span>
            <span className="small strong" style={{ color: 'var(--success)' }}>+12%</span>
          </div>
          <div className="tiny muted" style={{ marginTop: -12 }}>vs previous 7 days</div>
          <Bars values={dayBars} labels={days7.map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(d + 'T12:00').getDay()])} />
        </section>
        <section className="card">
          <div className="card-head">
            <h2>Quote requests</h2>
            <button className="link" onClick={() => nav('/quotes')}>
              View all
            </button>
          </div>
          {newQuotes.length === 0 && <Empty title="No new requests" text="You have answered every quote request." icon={<IconClipboardCheck size={28} />} />}
          {newQuotes.slice(0, 3).map((q, i) => (
            <button key={q.id} className="row" style={{ background: 'none', border: 'none', borderTop: i ? '1px solid var(--line)' : 'none', padding: i ? '12px 0 0' : 0, textAlign: 'left', cursor: 'pointer', width: '100%' }} onClick={() => nav(`/quotes/${q.id}`)}>
              <Avatar name={q.contractor} tone={i === 1 ? 'orange' : undefined} />
              <span className="grow">
                <span className="row between">
                  <b className="small">{q.contractor}</b>
                  <span className="tiny muted">{fmtStamp(q.received).replace('Today, ', '')}</span>
                </span>
                <span className="tiny muted">
                  {q.need} · {shortDate(q.start)} – {shortDate(q.end)}
                </span>
              </span>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--orange)', flex: 'none' }} />
            </button>
          ))}
        </section>
      </div>

      <section className="banner-cta">
        <img src={img('images/excavator-banner.jpg')} alt="" />
        <div className="grow">
          <div style={{ fontSize: 20, fontWeight: 600 }}>List more equipment, earn more</div>
          <div style={{ color: '#c9d7ea' }}>Contractors in Atlanta are searching for excavators and loaders this week.</div>
        </div>
        <button className="btn btn-white btn-lg" onClick={() => nav('/equipment/new')}>
          Add equipment <IconArrowRight size={18} />
        </button>
      </section>
    </>
  );
}
