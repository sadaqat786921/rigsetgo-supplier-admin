import { useCallback, useMemo, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  IconLayoutGrid, IconBuildingStore, IconBox, IconTag, IconCalendar, IconFileText, IconClipboardList, IconTruckDelivery,
  IconShieldCheck, IconStar, IconMessageCircle, IconWallet, IconUsers, IconAdjustmentsHorizontal, IconSearch, IconBell,
  IconChevronDown, IconPlus, IconLogout, IconRefresh, IconHelpCircle, IconSettings, IconUserCircle, IconChecks, IconRoute,
} from '@tabler/icons-react';
import { useStore } from '../store/store';
import { ConfirmDialog, Modal, useOutside } from './ui';
import { TODAY } from '../data/seed';
import { eqName } from '../data/utils';
import { img } from '../data/images';

const NAV = [
  { to: '/', label: 'Dashboard', icon: IconLayoutGrid, end: true },
  { to: '/storefront', label: 'Storefront', icon: IconBuildingStore },
  { to: '/equipment', label: 'Equipment', icon: IconBox },
  { to: '/pricing', label: 'Pricing', icon: IconTag },
  { to: '/calendar', label: 'Calendar', icon: IconCalendar },
  { to: '/quotes', label: 'Quote Requests', icon: IconFileText, count: 'quotes' },
  { to: '/bookings', label: 'Bookings', icon: IconClipboardList },
  { to: '/deliveries', label: 'Deliveries & Tracking', icon: IconTruckDelivery },
  { to: '/compliance', label: 'Compliance', icon: IconShieldCheck, count: 'compliance' },
  { to: '/reviews', label: 'Reviews', icon: IconStar },
  { to: '/support', label: 'Support Cases', icon: IconMessageCircle, count: 'support' },
  { to: '/earnings', label: 'Earnings & Payouts', icon: IconWallet },
  { to: '/team', label: 'Team & Roles', icon: IconUsers },
  { to: '/settings', label: 'Business Settings', icon: IconAdjustmentsHorizontal },
];

const TITLES: Record<string, [string, string]> = {
  storefront: ['Your public page', 'Storefront'],
  equipment: ['Machines and units', 'Equipment'],
  pricing: ['Rates, fees and deposits', 'Pricing'],
  calendar: ['Availability for every unit', 'Calendar'],
  quotes: ['Contractors asking for a price', 'Quote Requests'],
  bookings: ['Every rental from start to finish', 'Bookings'],
  deliveries: ['Drivers, deliveries and returns', 'Deliveries & Tracking'],
  compliance: ['Documents and expiry dates', 'Compliance'],
  reviews: ['What contractors say', 'Reviews'],
  support: ['Problems on a booking', 'Support Cases'],
  earnings: ['Money in and payouts', 'Earnings & Payouts'],
  team: ['People and access', 'Team & Roles'],
  settings: ['Profile, bank, alerts and history', 'Business Settings'],
};

const TOUR = [
  { photo: 'images/excavator-sunset.jpg', title: 'Welcome to RigSetGo, Mark', text: 'This is your supplier portal. Everything you need to rent out your equipment is in the menu on the left.' },
  { photo: 'images/wheel-loaders.jpg', title: 'Your dashboard', text: 'Each morning, the dashboard shows today’s deliveries, alerts that need action, new quote requests and your earnings.' },
  { photo: 'images/road-roller.jpg', title: 'Equipment, prices and calendar', text: 'Add machines, set daily, weekly and 4-week rates, and block days for repairs or rentals made outside RigSetGo.' },
  { photo: 'images/pipelayers.jpg', title: 'Bookings, deliveries and payouts', text: 'Accept bookings, assign drivers, follow deliveries live on the map, and see exactly when you get paid.' },
];

export default function Layout() {
  const { state, update, auth, setAuth, resetDemo } = useStore();
  const nav = useNavigate();
  const loc = useLocation();
  const [menu, setMenu] = useState<'' | 'notif' | 'profile' | 'search'>('');
  const [q, setQ] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [help, setHelp] = useState(false);
  const [slide, setSlide] = useState(0);
  const close = useCallback(() => setMenu(''), []);
  const notifRef = useOutside<HTMLDivElement>(menu === 'notif', close);
  const profRef = useOutside<HTMLDivElement>(menu === 'profile', close);
  const searchRef = useOutside<HTMLDivElement>(menu === 'search', close);

  const counts = {
    quotes: state.quotes.filter((x) => x.status === 'New').length,
    compliance: state.docs.filter((d) => d.status === 'Expired' || d.status === 'Expiring soon' || d.status === 'Rejected').length,
    support: state.cases.filter((c) => c.status === 'Waiting on you').length,
  } as Record<string, number>;
  const unread = state.notifications.filter((n) => !n.read).length;
  const todayJobs = state.jobs.filter((j) => j.date === TODAY);
  const active = state.bookings.filter((b) => ['Active', 'Out for delivery', 'Return requested'].includes(b.status)).length;

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const out: { label: string; sub: string; to: string }[] = [];
    state.equipment.forEach((e) => (e.name + e.category + e.units.map((u) => u.id).join(' ')).toLowerCase().includes(s) && out.push({ label: e.name, sub: `Equipment · ${e.status}`, to: `/equipment/${e.id}` }));
    state.bookings.forEach((b) => (b.id + b.contractor + b.contactName).toLowerCase().includes(s) && out.push({ label: `${b.id} · ${b.contractor}`, sub: `Booking · ${eqName(state, b.equipmentId)} · ${b.status}`, to: `/bookings/${b.id}` }));
    state.quotes.forEach((x) => (x.id + x.contractor + x.need).toLowerCase().includes(s) && out.push({ label: `${x.id} · ${x.contractor}`, sub: `Quote request · ${x.need}`, to: `/quotes/${x.id}` }));
    state.cases.forEach((c) => (c.id + c.subject + c.bookingId).toLowerCase().includes(s) && out.push({ label: `${c.id} · ${c.subject}`, sub: `Support case · ${c.status}`, to: `/support/${c.id}` }));
    state.members.forEach((m) => (m.name + m.email).toLowerCase().includes(s) && out.push({ label: m.name, sub: `Team member`, to: '/team' }));
    return out.slice(0, 8);
  }, [q, state]);

  if (!auth.signedIn) return <Navigate to="/login" replace />;

  const key = loc.pathname.split('/')[1];
  const [, title] = key ? TITLES[key] ?? ['', 'RigSetGo'] : ['Dashboard', 'Good morning, Mark'];
  const small = key ? 'Friday, November 20, 2026' : 'Dashboard';

  const go = (to: string) => {
    setMenu('');
    setQ('');
    nav(to);
  };

  return (
    <div className="app">
      <aside className="sidebar" aria-label="Main menu">
        <img className="logo" src={img('images/logo.svg')} alt="RigSetGo – Construction Equipment Rentals" />
        <div className="profile">
          <div className="avatar lg">MR</div>
          <div>
            <div className="muted small">Hello,</div>
            <div className="strong">Mark Rivera</div>
            <div className="tiny strong" style={{ color: 'var(--navy)' }}>
              {state.business.legalName.replace(' LLC', '')}
            </div>
          </div>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              <n.icon size={20} stroke={1.8} />
              {n.label}
              {n.count && counts[n.count] > 0 && <span className="count">{counts[n.count]}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="today-card">
          <div className="row between">
            <b style={{ fontSize: 17 }}>Today</b>
            <button className="link" style={{ color: 'var(--on-navy-muted)' }} onClick={() => nav('/deliveries')}>
              View all
            </button>
          </div>
          <div className="item" onClick={() => nav('/deliveries')}>
            <small>Deliveries</small>
            <div>
              <b>{todayJobs.filter((j) => j.type === 'Delivery').length}</b>
              <span>scheduled</span>
            </div>
          </div>
          <div className="item" onClick={() => nav('/deliveries')}>
            <small>Pickups</small>
            <div>
              <b>{todayJobs.filter((j) => j.type === 'Pickup').length}</b>
              <span>scheduled</span>
            </div>
          </div>
          <div className="item" onClick={() => nav('/bookings')}>
            <small>Active rentals</small>
            <div>
              <b>{active}</b>
              <span>machines</span>
            </div>
          </div>
          <button className="btn btn-white btn-block" onClick={() => nav('/equipment/new')}>
            <IconPlus size={18} /> Add equipment
          </button>
        </div>
        <div className="side-photo">
          <img src={img('images/excavator-sky.jpg')} alt="Excavator on site" />
        </div>
      </aside>

      <div className="main">
        <header className="header">
          <div className="title">
            <small>{small}</small>
            <h1>{title}</h1>
          </div>
          <div className="header-actions">
            <div className="dropdown" ref={searchRef}>
              <div className="search" style={{ width: 320 }}>
                <IconSearch size={18} color="var(--muted)" />
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setMenu('search');
                  }}
                  onFocus={() => setMenu('search')}
                  placeholder="Search bookings, equipment…"
                  aria-label="Search"
                />
              </div>
              {menu === 'search' && q.trim().length >= 2 && (
                <div className="menu search-results">
                  {results.length === 0 && <div className="muted small" style={{ padding: 12 }}>No results for “{q}”. Try a booking number, machine or contractor.</div>}
                  {results.map((r) => (
                    <button key={r.to + r.label} onClick={() => go(r.to)}>
                      <div>
                        <div className="strong">{r.label}</div>
                        <div className="tiny muted">{r.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="dropdown" ref={notifRef}>
              <button className="icon-btn" aria-label="Notifications" onClick={() => setMenu(menu === 'notif' ? '' : 'notif')}>
                <IconBell size={20} />
                {unread > 0 && <span className="dot">{unread}</span>}
              </button>
              {menu === 'notif' && (
                <div className="menu notif-menu">
                  <div className="row between" style={{ padding: '14px 16px' }}>
                    <b>Notifications</b>
                    <button className="link" onClick={() => update((s) => s.notifications.forEach((n) => (n.read = true)))}>
                      <IconChecks size={14} /> Mark all as read
                    </button>
                  </div>
                  <div className="divider" />
                  <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {state.notifications.length === 0 && <div className="muted small" style={{ padding: 16 }}>You’re all caught up.</div>}
                    {state.notifications.map((n) => (
                      <button
                        key={n.id}
                        className={`notif-item ${n.read ? '' : 'unread'}`}
                        onClick={() => {
                          update((s) => {
                            const x = s.notifications.find((y) => y.id === n.id);
                            if (x) x.read = true;
                          });
                          go(n.link);
                        }}
                      >
                        <span className="icon-circle" style={{ width: 34, height: 34 }}>
                          <IconBell size={16} />
                        </span>
                        <div className="grow">
                          <div className="small" style={{ fontWeight: n.read ? 400 : 600 }}>
                            {n.text}
                          </div>
                          <div className="tiny muted">{n.time}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="dropdown" ref={profRef}>
              <button className="row" style={{ background: 'none', border: 'none', cursor: 'pointer', gap: 10 }} onClick={() => setMenu(menu === 'profile' ? '' : 'profile')} aria-label="Profile menu">
                <div className="avatar">MR</div>
                <div style={{ textAlign: 'left' }}>
                  <div className="strong small">Mark Rivera</div>
                  <div className="tiny muted">Supplier Admin</div>
                </div>
                <IconChevronDown size={16} color="var(--muted)" />
              </button>
              {menu === 'profile' && (
                <div className="menu">
                  <div style={{ padding: '8px 12px' }}>
                    <div className="strong">Mark Rivera</div>
                    <div className="tiny muted">{auth.email || 'mark@atlantaheavyrentals.com'}</div>
                  </div>
                  <div className="sep" />
                  <button onClick={() => go('/settings')}>
                    <IconSettings size={18} /> Business settings
                  </button>
                  <button onClick={() => go('/team')}>
                    <IconUserCircle size={18} /> Team & roles
                  </button>
                  <button
                    onClick={() => {
                      setMenu('');
                      setSlide(0);
                      setAuth({ tourOpen: true });
                    }}
                  >
                    <IconRoute size={18} /> Take the welcome tour
                  </button>
                  <button
                    onClick={() => {
                      setMenu('');
                      setConfirmReset(true);
                    }}
                  >
                    <IconRefresh size={18} /> Reset demo data
                  </button>
                  <div className="sep" />
                  <button
                    onClick={() => {
                      setMenu('');
                      setAuth({ signedIn: false, codeStep: false, wrongCodes: 0 });
                      nav('/login');
                    }}
                  >
                    <IconLogout size={18} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>

        <footer className="footer">
          <span>© 2026 RigSetGo · Atlanta, GA</span>
          <nav>
            <button onClick={() => setHelp(true)}>
              <IconHelpCircle size={14} style={{ verticalAlign: -2 }} /> Help
            </button>
            <button onClick={() => setHelp(true)}>Privacy</button>
            <button onClick={() => setHelp(true)}>Terms</button>
          </nav>
        </footer>
      </div>

      {confirmReset && (
        <ConfirmDialog
          title="Reset demo data?"
          text="All changes you made in this demo will be cleared and the sample data will come back. You will stay signed in."
          confirmLabel="Reset demo data"
          onConfirm={() => {
            resetDemo();
            nav('/');
          }}
          onClose={() => setConfirmReset(false)}
        />
      )}

      {help && (
        <Modal
          title="Help and policies"
          sub="RigSetGo support is here for you, Monday to Saturday, 7 AM to 7 PM."
          onClose={() => setHelp(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setHelp(false)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setHelp(false);
                  nav('/support?new=1');
                }}
              >
                Open a support case
              </button>
            </>
          }
        >
          <div className="col gap-8">
            <div className="strong">Phone</div>
            <div className="muted">(404) 555-0100</div>
            <div className="strong">Email</div>
            <div className="muted">support@rigsetgo.com</div>
            <div className="strong">Privacy and terms</div>
            <div className="muted small">Your documents and bank details are private. Only the RigSetGo team can see verification documents. Contractors only see your public storefront, listings and policies.</div>
          </div>
        </Modal>
      )}

      {auth.tourOpen && (
        <div className="backdrop">
          <div className="modal tour" role="dialog" aria-label="Welcome tour">
            <div className="hero-photo">
              <img src={img(TOUR[slide].photo)} alt="" />
            </div>
            <div className="modal-body" style={{ alignItems: 'center' }}>
              <div className="tiny strong" style={{ color: 'var(--navy)' }}>
                Step {slide + 1} of {TOUR.length}
              </div>
              <h2 style={{ fontSize: 24 }}>{TOUR[slide].title}</h2>
              <p className="muted">{TOUR[slide].text}</p>
              <div className="dots" style={{ marginTop: 4 }}>
                {TOUR.map((_, i) => (
                  <i key={i} className={i === slide ? 'on' : ''} style={{ background: i === slide ? undefined : 'var(--line-strong)' }} />
                ))}
              </div>
            </div>
            <div className="modal-foot" style={{ justifyContent: 'space-between' }}>
              <button className="btn btn-ghost" onClick={() => setAuth({ tourOpen: false, tourDone: true })}>
                Skip tour
              </button>
              <div className="row">
                {slide > 0 && (
                  <button className="btn btn-secondary" onClick={() => setSlide(slide - 1)}>
                    Back
                  </button>
                )}
                {slide < TOUR.length - 1 ? (
                  <button className="btn btn-primary" onClick={() => setSlide(slide + 1)}>
                    Next
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={() => setAuth({ tourOpen: false, tourDone: true })}>
                    Start using RigSetGo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
