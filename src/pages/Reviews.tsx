import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconFlag, IconStar } from '@tabler/icons-react';
import { useStore } from '../store/store';
import { Avatar, Badge, Empty, Pills, ReasonDialog, Stars } from '../components/ui';
import type { Review } from '../data/types';
import { eqName, fmtDate } from '../data/utils';

const avg = (r: Review) => (r.accuracy + r.delivery + r.service) / 3;

export default function Reviews() {
  const { state, update } = useStore();
  const nav = useNavigate();
  const [filter, setFilter] = useState<'All' | 'Reported' | 'Low ratings'>('All');
  const [report, setReport] = useState<Review | null>(null);
  const visible = state.reviews.filter((r) => r.report?.status !== 'Removed');
  const list = state.reviews.filter((r) => (filter === 'Reported' ? !!r.report : filter === 'Low ratings' ? avg(r) < 3 : true));
  const score = (k: 'accuracy' | 'delivery' | 'service') => (visible.reduce((s, r) => s + r[k], 0) / Math.max(1, visible.length)).toFixed(1);
  const overall = (visible.reduce((s, r) => s + avg(r), 0) / Math.max(1, visible.length)).toFixed(1);
  const decide = (r: Review, keep: boolean) =>
    update(
      (s) => {
        const x = s.reviews.find((y) => y.id === r.id)!;
        x.report!.status = keep ? 'Kept' : 'Removed';
      },
      { history: `RigSetGo ${keep ? 'kept' : 'removed'} the review from ${r.contractor}`, notify: { text: `Your report on the review from ${r.contractor} was decided: ${keep ? 'kept' : 'removed'}`, link: '/reviews' }, toast: keep ? 'RigSetGo kept the review' : 'RigSetGo removed the review' },
    );
  return (
    <>
      <div className="page-head">
        <div>
          <h2 style={{ fontSize: 22 }}>What contractors say about you</h2>
          <p>Only contractors with a finished rental can leave a review. You can report a review that is fake, abusive or wrong.</p>
        </div>
      </div>
      <div className="grid g4">
        <div className="kpi">
          <span className="label">Overall rating</span>
          <span className="value row gap-8">
            {overall} <Stars value={Number(overall)} size={20} />
          </span>
          <span className="tiny muted">{visible.length} reviews</span>
        </div>
        {(
          [
            ['Equipment accuracy', 'accuracy'],
            ['Delivery', 'delivery'],
            ['Service', 'service'],
          ] as const
        ).map(([l, k]) => (
          <div key={k} className="kpi">
            <span className="label">{l}</span>
            <span className="value">{score(k)}</span>
            <Stars value={Number(score(k))} />
          </div>
        ))}
      </div>
      <section className="card">
        <Pills items={['All', 'Reported', 'Low ratings'] as const} value={filter} onChange={setFilter} />
        {list.length === 0 && <Empty title="No reviews here" icon={<IconStar size={28} />} />}
        {list.map((r) => (
          <div key={r.id} className="col gap-8" style={{ borderTop: '1px solid var(--line)', paddingTop: 16, opacity: r.report?.status === 'Removed' ? 0.55 : 1 }}>
            <div className="row between top">
              <div className="row">
                <Avatar name={r.contractor} />
                <div>
                  <div className="strong">{r.contractor}</div>
                  <div className="tiny muted">
                    {fmtDate(r.date)} · {eqName(state, r.equipmentId)} ·{' '}
                    <button className="link tiny" onClick={() => nav(`/bookings/${r.bookingId}`)} disabled={!state.bookings.some((b) => b.id === r.bookingId)}>
                      {r.bookingId}
                    </button>
                  </div>
                </div>
              </div>
              <div className="row">
                <Stars value={avg(r)} />
                <b>{avg(r).toFixed(1)}</b>
              </div>
            </div>
            <p>{r.text}</p>
            <div className="row wrap gap-16 tiny muted">
              <span>Accuracy {r.accuracy}/5</span>
              <span>Delivery {r.delivery}/5</span>
              <span>Service {r.service}/5</span>
            </div>
            {r.report ? (
              <div className={`banner ${r.report.status === 'Under review' ? 'warning' : r.report.status === 'Removed' ? 'success' : 'info'} small`}>
                <IconFlag size={18} />
                <div className="grow">
                  <b>
                    {r.report.status === 'Under review' ? 'You reported this review. RigSetGo is checking it.' : r.report.status === 'Removed' ? 'RigSetGo removed this review. It is no longer public.' : 'RigSetGo decided to keep this review.'}
                  </b>
                  {r.report.reason}: {r.report.details}
                </div>
                {r.report.status === 'Under review' && (
                  <span className="row gap-8">
                    <span className="tiny">Demo decision:</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => decide(r, true)}>
                      Keep
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => decide(r, false)}>
                      Remove
                    </button>
                  </span>
                )}
              </div>
            ) : (
              <div>
                <button className="btn btn-ghost btn-sm" onClick={() => setReport(r)}>
                  <IconFlag size={16} /> Report this review
                </button>
              </div>
            )}
          </div>
        ))}
      </section>
      {report && (
        <ReasonDialog
          title="Report this review"
          text="The RigSetGo team checks every report. The review stays visible until they decide. Both sides are told the decision."
          options={['Fake or not a real rental', 'Abusive or offensive', 'Spam or advertising', 'Wrong information', 'Other']}
          placeholder="Explain what is wrong. Add any proof you have."
          confirmLabel="Send report"
          onConfirm={(reason) => {
            const [main, ...rest] = reason.split(': ');
            update(
              (s) => {
                const x = s.reviews.find((y) => y.id === report.id)!;
                x.report = { reason: main, details: rest.join(': '), status: 'Under review' };
              },
              { history: `Reported the review from ${report.contractor}: ${main}`, toast: 'Report sent to RigSetGo' },
            );
          }}
          onClose={() => setReport(null)}
        />
      )}
    </>
  );
}
