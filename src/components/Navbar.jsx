import { Link, NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Beranda', end: true },
  { to: '/kategori', label: 'Kategori' },
  { to: '/cari', label: 'Cari' },
  { to: '/favorit', label: 'Favorit' },
  { to: '/riwayat', label: 'Riwayat' },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-dark-700 bg-dark-950/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
            📖
          </span>
          <span>
            Web<span className="text-accent">Komik</span>
          </span>
        </Link>
        <ul className="flex items-center gap-1">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-dark-700 text-accent'
                      : 'text-gray-300 hover:bg-dark-700 hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
