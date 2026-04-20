import type { ViewKey } from '../App';

interface NavItem {
  key: ViewKey;
  label: string;
  icon: string;
}

const NAV: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '◆' },
  { key: 'new-post', label: 'New Post', icon: '✎' },
  { key: 'posts', label: 'All Posts', icon: '▤' },
];

interface SidebarProps {
  current: ViewKey;
  onSelect: (view: ViewKey) => void;
  postCount: number;
}

export function Sidebar({ current, onSelect, postCount }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">RP</div>
        <div>
          <div className="brand-title">React-Py Admin</div>
          <div className="brand-sub">Content console</div>
        </div>
      </div>

      <nav className="nav">
        {NAV.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`nav-item${current === item.key ? ' active' : ''}`}
            onClick={() => onSelect(item.key)}
          >
            <span className="nav-icon" aria-hidden>
              {item.icon}
            </span>
            <span className="nav-label">{item.label}</span>
            {item.key === 'posts' && postCount > 0 && (
              <span className="nav-badge">{postCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="footer-status">
          <span className="status-dot" />
          Connected
        </div>
        <div className="footer-hint">FastAPI · PostgreSQL</div>
      </div>
    </aside>
  );
}
