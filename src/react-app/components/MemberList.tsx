import './MemberList.css';

import { useState } from 'react';

type Member = {
  id: number;
  name: string;
  phone: string;
  plan: string;
  expiry: string;
};

const base: Member[] = [
  {
    id: 1,
    name: 'Rahul Sharma',
    phone: '9876543210',
    plan: '3 months',
    expiry: '2026-10-20',
  },
  {
    id: 2,
    name: 'Anil Kumar',
    phone: '9812345678',
    plan: '1 month',
    expiry: '2026-11-02',
  },
  {
    id: 3,
    name: 'Priya Singh',
    phone: '9988776655',
    plan: '12 months',
    expiry: '2026-10-09',
  },
];

const members: Member[] = Array.from({ length: 25 }, (_, i) => ({
  ...base[i % 3],
  id: i + 1,
  name: `${base[i % 3].name} ${i + 1}`, // makes each name distinct too
}));

const PAGE_SIZE = 7;

export default function MemberList() {
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);

  const sorted = [...members].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const visible = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goTo = (p: number) => {
    setPage(p);
    setOpenId(null); // close any open bar when the page changes
  };

  return (
    <div className="member-area">
      {visible.map((m) => {
        const open = openId === m.id;
        return (
          <div key={m.id} className="member">
            <button
              className="bar"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : m.id)}
            >
              <span>{m.name}</span>
              <span className="chevron">{open ? '▲' : '▼'}</span>
            </button>

            <div className={`details-wrap ${open ? 'open' : ''}`}>
              <div className="details">
                <div className="details-inner">
                  <p>
                    <strong>Phone:</strong>{' '}
                    <a href={`tel:${m.phone.replace(/\s/g, '')}`}>{m.phone}</a>
                  </p>
                  <p>
                    <strong>Plan:</strong> {m.plan}
                  </p>
                  <p>
                    <strong>Expires:</strong> {m.expiry}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="pager">
        <button disabled={page <= 1} onClick={() => goTo(page - 1)}>
          Prev
        </button>
        <span>
          Page {page} of {pages}
        </span>
        <button disabled={page >= pages} onClick={() => goTo(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
