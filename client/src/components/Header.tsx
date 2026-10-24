import { IconButton } from '@capitec/design-system';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Header({ theme, onToggleTheme }: HeaderProps) {
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="brand" href="/" aria-label="Capitec Loan Simulator, home">
          <span className="brand__mark" aria-hidden="true">
            <span className="brand__dot brand__dot--blue" />
            <span className="brand__dot brand__dot--red" />
          </span>
          <span className="brand__name">capitec</span>
          <span className="brand__divider" aria-hidden="true" />
          <span className="brand__product">Loan Simulator</span>
        </a>
        <IconButton icon={theme === 'dark' ? 'sun' : 'moon'} label={`Switch to ${next} theme`} onClick={onToggleTheme} />
      </div>
    </header>
  );
}
