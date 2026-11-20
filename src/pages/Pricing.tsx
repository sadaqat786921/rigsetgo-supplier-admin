import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconInfoCircle, IconEdit } from '@tabler/icons-react';
import { useStore } from '../store/store';
import { Badge, Field, Modal, Toggle } from '../components/ui';
import type { Equipment, Pricing } from '../data/types';
import { money } from '../data/utils';

export function PricingModal({ eq, onClose }: { eq: Equipment; onClose: () => void }) {
  const { update } = useStore();
  const [p, setP] = useState<Pricing>(eq.pricing ?? { daily: 0, weekly: 0, fourWeek: 0, minDays: 1, hoursPerDay: 8, overtimePerHour: 0, deliveryFee: 0, deposit: 0, weekendRule: 'Weekends charged' });
  const [mode, setMode] = useState(eq.bookingMode);
  const [err, setErr] = useState('');
  const fields: [string, keyof Pricing][] = [
    ['Daily rate ($)', 'daily'],
    ['Weekly rate ($)', 'weekly'],
    ['4-week rate ($)', 'fourWeek'],
    ['Minimum rental (days)', 'minDays'],
    ['Engine hours included per day', 'hoursPerDay'],
    ['Overtime per hour ($)', 'overtimePerHour'],
    ['Delivery fee ($)', 'deliveryFee'],
    ['Deposit ($)', 'deposit'],
  ];
  const save = () => {
    if (!p.daily || !p.weekly || !p.fourWeek) return setErr('Daily, weekly and 4-week rates are required.');
    if (p.weekly > p.daily * 7) return setErr('The weekly rate should not be more than 7 daily rates.');
    if (p.fourWeek > p.weekly * 4) return setErr('The 4-week rate should not be more than 4 weekly rates.');
    const changes: string[] = [];
    if (eq.pricing) {
      if (eq.pricing.daily !== p.daily) changes.push(`daily ${money(eq.pricing.daily)} → ${money(p.daily)}`);
      if (eq.pricing.weekly !== p.weekly) changes.push(`weekly ${money(eq.pricing.weekly)} → ${money(p.weekly)}`);
      if (eq.pricing.fourWeek !== p.fourWeek) changes.push(`4-week ${money(eq.pricing.fourWeek)} → ${money(p.fourWeek)}`);
    }
    update(
      (s) => {
        const x = s.equipment.find((y) => y.id === eq.id)!;
        x.pricing = p;
        x.bookingMode = mode;
      },
      { history: `Updated prices for ${eq.name}${changes.length ? `: ${changes.join(', ')}` : ''}`, toast: 'Prices saved. They apply to new bookings only' },
    );
    onClose();
  };
  return (
    <Modal
      title={`Prices · ${eq.name}`}
      sub="Contractors see every charge before they pay. Confirmed bookings keep their old price."
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save}>
            Save prices
          </button>
        </>
      }
    >
      {err && <div className="banner danger small">{err}</div>}
      <div className="grid g3" style={{ gap: 16 }}>
        {fields.map(([l, k]) => (
          <Field key={k} label={l}>
            <input className="input" type="number" min={0} value={(p[k] as number) || ''} onChange={(e) => setP({ ...p, [k]: Number(e.target.value) })} />
          </Field>
        ))}
        <Field label="Weekends">
          <select className="select" value={p.weekendRule} onChange={(e) => setP({ ...p, weekendRule: e.target.value as Pricing['weekendRule'] })}>
            <option>Weekends charged</option>
            <option>Weekends free</option>
          </select>
        </Field>
      </div>
      <div className="row between" style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 16 }}>
        <div>
          <div className="strong">Instant booking</div>
          <div className="tiny muted">On: contractors book and pay straight away. Off: they must ask for a quote first.</div>
        </div>
        <Toggle label="Instant booking" checked={mode === 'instant'} onChange={(v) => setMode(v ? 'instant' : 'quote')} />
      </div>
      <div className="banner info small">
        <IconInfoCircle size={18} />
        <div className="grow">Rental days are counted per calendar day. Example for 10 days: 1 week ({money(p.weekly || 0)}) + 3 days ({money((p.daily || 0) * 3)}) = {money((p.weekly || 0) + (p.daily || 0) * 3)} plus delivery and tax.</div>
      </div>
    </Modal>
  );
}

export default function PricingPage() {
  const { state } = useStore();
  const nav = useNavigate();
  const [edit, setEdit] = useState<Equipment | null>(null);
  const list = state.equipment.filter((e) => e.status !== 'Retired');
  return (
    <>
      <div className="page-head">
        <div>
          <h2 style={{ fontSize: 22 }}>Rates, fees and deposits</h2>
          <p>Price changes apply to new bookings only. Every change is saved in history.</p>
        </div>
      </div>
      <section className="card flat">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Daily</th>
                <th>Weekly</th>
                <th>4 weeks</th>
                <th>Min. days</th>
                <th>Delivery</th>
                <th>Deposit</th>
                <th>Booking mode</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id}>
                  <td>
                    <button className="row" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }} onClick={() => nav(`/equipment/${e.id}`)}>
                      <img className="thumb" src={e.photo} alt="" />
                      <div>
                        <div className="strong">{e.name}</div>
                        <div className="tiny muted">{e.units.length} units</div>
                      </div>
                    </button>
                  </td>
                  {e.pricing ? (
                    <>
                      <td className="strong">{money(e.pricing.daily)}</td>
                      <td>{money(e.pricing.weekly)}</td>
                      <td>{money(e.pricing.fourWeek)}</td>
                      <td>{e.pricing.minDays}</td>
                      <td>{money(e.pricing.deliveryFee)}</td>
                      <td>{money(e.pricing.deposit)}</td>
                    </>
                  ) : (
                    <td colSpan={6}>
                      <Badge tone="orange">No prices yet</Badge>
                    </td>
                  )}
                  <td>
                    <Badge tone="navy">{e.bookingMode === 'instant' ? 'Instant' : 'Quote only'}</Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEdit(e)}>
                      <IconEdit size={16} /> {e.pricing ? 'Edit' : 'Set prices'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card">
        <div className="card-head">
          <h3>Recent price changes</h3>
        </div>
        {state.history.filter((h) => /price|rate/i.test(h.text)).slice(0, 5).map((h) => (
          <div key={h.id} className="row between small" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
            <span>{h.text}</span>
            <span className="muted tiny">{h.who} · {h.time}</span>
          </div>
        ))}
      </section>
      {edit && <PricingModal eq={edit} onClose={() => setEdit(null)} />}
    </>
  );
}
