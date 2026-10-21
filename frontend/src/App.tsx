import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AlertTriangle, ArrowRight, BarChart3, Boxes, ChevronDown, CircleHelp, Edit3, LayoutDashboard, Loader2, LogOut, Menu, MessageSquare, MoreHorizontal, Package, Plus, Search, Send, Settings, ShieldCheck, ShoppingBag, Store as StoreIcon, Trash2, Users, X } from 'lucide-react';
import { api, ApiError, asList } from '@/lib/api';
import type { AssistantResponse, AuthMe, Membership, Product, ProductInput, Role, Store, User } from '@/types';
const money = (value: number | string) => `Rs. ${Number(value || 0).toLocaleString('en-LK', { maximumFractionDigits: 2 })}`;
const roleLabel = (role?: Role) => role === 'administrator' ? 'Administrator' : role === 'manager' ? 'Store manager' : 'Staff';
const normalize = <T,>(data: unknown, key: string): T | null => (data && typeof data === 'object' && key in data ? (data as Record<string, T>)[key] : null);
function Brand({ compact = false }: {
    compact?: boolean;
}) {
    return <div className={`brand ${compact ? 'brand-compact' : ''}`}><span className="brand-mark"><StoreIcon size={compact ? 17 : 19} strokeWidth={2.7}/></span><span><b>Mall</b><strong>Desk</strong></span></div>;
}
function LoginPage({ onLogin }: {
    onLogin: (user: User, stores: Store[]) => void;
}) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const submit = async (event: FormEvent) => { event.preventDefault(); if (!username || !password) {
        setError('Enter your username and password to continue.');
        return;
    } setLoading(true); setError(''); try {
        const result = await api.login(username, password);
        const auth = (normalize<AuthMe>(result, 'user') ? result as AuthMe : await api.me()) as AuthMe;
        const stores = auth.stores || asList<Store>(await api.stores());
        onLogin(auth.user, stores);
    }
    catch (err) {
        setError(err instanceof ApiError ? err.message : 'We could not sign you in. Check your details and try again.');
    }
    finally {
        setLoading(false);
    } };
    return <main className="login-shell"><div className="login-art"><div className="art-grid"/><div className="art-copy"><Brand /><p className="eyebrow">RETAIL OPERATIONS, SIMPLIFIED</p><h1>One clear view of every store.</h1><p>Keep products, teams, and decisions moving together with a calmer way to run your retail operation.</p><div className="art-stat"><span className="stat-icon"><BarChart3 size={18}/></span><span><b>Connected retail</b><small>Everything your team needs, in one place.</small></span></div></div><div className="login-footer">MALLDESK <span>/</span> OPERATIONS WORKSPACE</div></div><section className="login-panel"><div className="login-form-wrap"><div className="mobile-brand"><Brand /></div><div className="form-kicker">WELCOME BACK</div><h2>Sign in to MallDesk</h2><p className="muted">Use your staff account to continue.</p><form onSubmit={submit} className="stack-form"><label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. amanda" autoComplete="username"/></label><label>Password<div className="input-with-action"><input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password"/><button type="button" className="input-action" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button></div></label>{error && <div className="alert alert-danger"><AlertTriangle size={16}/>{error}</div>}<button className="button button-primary button-wide" disabled={loading}>{loading ? <Loader2 className="spin" size={17}/> : <ArrowRight size={17}/>}{loading ? 'Signing in…' : 'Sign in'}</button></form><p className="form-note"><ShieldCheck size={15}/> Your session is protected by your organization’s sign-in.</p></div></section></main>;
}
function AppLayout({ user, stores, selectedStore, onStoreChange, onLogout, }: {
    user: User;
    stores: Store[];
    selectedStore: Store | null;
    onStoreChange: (store: Store) => void;
    onLogout: () => void;
}) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [storeMenuOpen, setStoreMenuOpen] = useState(false);
    const location = useLocation();
    const nav = [
        { to: '/', label: 'Overview', icon: LayoutDashboard },
        { to: '/products', label: 'Products', icon: Package },
        ...(selectedStore?.role === 'administrator'
            ? [{ to: '/users', label: 'Store users', icon: Users }]
            : []),
        { to: '/assistant', label: 'AI assistant', icon: MessageSquare },
    ];
    return (<div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <Brand compact/>
          <button type="button" className="icon-button mobile-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}>
            <X size={19}/>
          </button>
        </div>

        <div className="store-switcher">
          <span className="nav-caption">ACTIVE STORE</span>
          <div className="store-switcher-current">
            <span>{selectedStore?.name || 'No store selected'}</span>
          </div>
          {selectedStore && (<div className="store-role">
              <span className="store-dot"/>
              {roleLabel(selectedStore.role)}
            </div>)}
        </div>

        <nav className="main-nav">
          <span className="nav-caption">WORKSPACE</span>
          {nav.map(({ to, label, icon: Icon }) => (<Link key={to} to={to} onClick={() => setMobileOpen(false)} className={location.pathname === to ? 'active' : ''}>
              <Icon size={18}/>
              {label}
            </Link>))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <CircleHelp size={17}/>
            <span>
              <b>Need a hand?</b>
              <small>Ask the assistant about your store.</small>
            </span>
          </div>

          <button type="button" className="sidebar-link">
            <Settings size={17}/>
            Settings
            <span className="soon">Soon</span>
          </button>

          <div className="user-chip">
            <span className="avatar">
              {(user.first_name || user.username).slice(0, 1).toUpperCase()}
            </span>
            <span className="user-details">
              <b>
                {user.first_name
            ? `${user.first_name} ${user.last_name || ''}`
            : user.username}
              </b>
              <small>{user.email || 'Signed in account'}</small>
            </span>
            <button type="button" className="icon-button" aria-label="Log out" onClick={onLogout}>
              <LogOut size={16}/>
            </button>
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <button type="button" className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
            <Menu size={20}/>
          </button>

          <div className="breadcrumbs">
            <span>MallDesk</span>
            <span>/</span>
            <b>
              {location.pathname === '/'
            ? 'Overview'
            : location.pathname.slice(1).replace('-', ' ')}
            </b>
          </div>

          
<div className="topbar-store-wrapper">
  <button
    type="button"
    className="topbar-store"
    aria-expanded={storeMenuOpen}
    aria-haspopup="menu"
    onClick={() => setStoreMenuOpen((open) => !open)}
  >
    <StoreIcon size={16} />
    <span>{selectedStore?.name || 'Select a store'}</span>
    <ChevronDown
      size={14}
      className={storeMenuOpen ? 'chevron-open' : ''}
    />
  </button>

  {storeMenuOpen && (
    <div className="store-dropdown" role="menu">
      <span className="store-dropdown-heading">SWITCH STORE</span>

      {stores.map((store) => (
        <button
          key={store.id}
          type="button"
          role="menuitem"
          className={`store-option ${
            selectedStore?.id === store.id ? 'selected' : ''
          }`}
          onClick={() => {
            onStoreChange(store);
            setStoreMenuOpen(false);
          }}
        >
          <StoreIcon size={15} />
          <span>{store.name}</span>
          {selectedStore?.id === store.id && <span>✓</span>}
        </button>
      ))}

      {stores.length === 0 && (
        <p className="store-dropdown-empty">No stores available</p>
      )}
    </div>
  )}
</div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>);
}
function PageHeader({ eyebrow, title, description, action }: {
    eyebrow: string;
    title: string;
    description?: string;
    action?: ReactNode;
}) { return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p className="muted page-description">{description}</p>}</div>{action}</div>; }
function EmptyStore() { return <div className="empty-state"><span className="empty-icon"><StoreIcon size={21}/></span><h3>Select a store to begin</h3><p>Your assigned stores will appear in the selector on the left.</p></div>; }
function LoadingState() { return <div className="loading-state"><Loader2 className="spin" size={20}/>Loading store data…</div>; }
function ErrorState({ message }: {
    message: string;
}) { return <div className="alert alert-danger"><AlertTriangle size={16}/>{message}</div>; }
function DashboardPage({ store }: {
    store: Store | null;
}) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => { if (!store) {
        setLoading(false);
        return;
    } let current = true; setLoading(true); api.products(store.id).then((data) => { if (current)
        setProducts(asList<Product>(data)); }).catch((err) => current && setError(err instanceof ApiError ? err.message : 'Could not load products.')).finally(() => current && setLoading(false)); return () => { current = false; }; }, [store]);
    if (!store)
        return <EmptyStore />;
    const low = products.filter((product) => product.stock_quantity <= (product.low_stock_threshold ?? 10));
    const stock = products.reduce((total, product) => total + Number(product.stock_quantity || 0), 0);
    return <><PageHeader eyebrow="STORE OVERVIEW" title={`Good to see you, ${store.name}.`} description="A quick read on what needs attention across your store." action={<Link to="/products" className="button button-primary"><Plus size={17}/>Add product</Link>}/>{error && <ErrorState message={error}/>}{loading ? <LoadingState /> : <><section className="metric-grid"><Metric icon={<Package size={18}/>} label="Total products" value={products.length} accent="orange"/><Metric icon={<Boxes size={18}/>} label="Total stock quantity" value={stock.toLocaleString()}/><Metric icon={<AlertTriangle size={18}/>} label="Low stock items" value={low.length} accent={low.length ? 'warning' : 'green'}/><Metric icon={<ShoppingBag size={18}/>} label="Catalog value" value={money(products.reduce((total, product) => total + Number(product.selling_price || 0) * Number(product.stock_quantity || 0), 0))}/></section><div className="content-grid"><section className="card"><div className="card-header"><div><h2>Low stock products</h2><p>Items that may need a reorder soon.</p></div><Link to="/products" className="text-link">View products <ArrowRight size={15}/></Link></div>{low.length ? <ProductTable products={low.slice(0, 5)} compact/> : <div className="quiet-empty"><span className="success-icon">✓</span><div><b>Inventory looks healthy</b><p>No products are below their low-stock threshold.</p></div></div>}</section><section className="card assistant-card"><div className="assistant-orb"><MessageSquare size={21}/></div><div><div className="eyebrow">MALLDESK ASSISTANT</div><h2>Have a question about this store?</h2><p>Get a quick answer about stock, products, or selling prices.</p><Link to="/assistant" className="button button-dark">Ask the assistant <ArrowRight size={16}/></Link></div></section></div></>}</>;
}
function Metric({ icon, label, value, accent = 'neutral' }: {
    icon: ReactNode;
    label: string;
    value: string | number;
    accent?: string;
}) { return <div className="metric-card"><span className={`metric-icon ${accent}`}>{icon}</span><span className="metric-label">{label}</span><strong>{value}</strong></div>; }
function ProductTable({ products, compact = false, onEdit, onDelete }: {
    products: Product[];
    compact?: boolean;
    onEdit?: (product: Product) => void;
    onDelete?: (product: Product) => void;
}) { return <div className="table-scroll"><table><thead><tr><th>Product</th><th>Price</th><th>Stock</th>{!compact && <th>Supplier</th>}{!compact && <th aria-label="Actions"/>}</tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><div className="product-name"><span className="product-avatar">{product.name.slice(0, 1).toUpperCase()}</span><span><b>{product.name}</b>{product.description && <small>{product.description}</small>}</span></div></td><td>{money(product.selling_price)}</td><td><span className={`stock-badge ${product.stock_quantity <= (product.low_stock_threshold ?? 10) ? 'warning' : 'healthy'}`}>{product.stock_quantity} units</span></td>{!compact && <td>{product.supplier || '—'}</td>}{!compact && <td><div className="row-actions"><button className="icon-button" onClick={() => onEdit?.(product)} aria-label={`Edit ${product.name}`}><Edit3 size={15}/></button><button className="icon-button danger-hover" onClick={() => onDelete?.(product)} aria-label={`Delete ${product.name}`}><Trash2 size={15}/></button></div></td>}</tr>)}</tbody></table></div>; }
function ProductsPage({ store }: {
    store: Store | null;
}) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [modal, setModal] = useState<'create' | Product | null>(null);
    const [deleting, setDeleting] = useState<Product | null>(null);
    const canManage = store?.role === 'administrator' || store?.role === 'manager';
    const load = async () => { if (!store) {
        setProducts([]);
        setLoading(false);
        return;
    } setLoading(true); setError(''); try {
        setProducts(asList<Product>(await api.products(store.id)));
    }
    catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load products.');
    }
    finally {
        setLoading(false);
    } };
    useEffect(() => { load(); }, [store?.id]);
    const filtered = useMemo(() => products.filter((product) => `${product.name} ${product.supplier || ''}`.toLowerCase().includes(query.toLowerCase())), [products, query]);
    const save = async (input: ProductInput, existing?: Product) => { if (!store)
        return; if (existing)
        await api.updateProduct(store.id, existing.id, input);
    else
        await api.createProduct(store.id, input); setModal(null); await load(); };
    const remove = async () => { if (!store || !deleting)
        return; try {
        await api.deleteProduct(store.id, deleting.id);
        setDeleting(null);
        await load();
    }
    catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not delete product.');
    } };
    if (!store)
        return <EmptyStore />;
    return <><PageHeader eyebrow="CATALOG" title="Products" description={`${products.length} products in ${store.name}.`} action={canManage ? <button className="button button-primary" onClick={() => setModal('create')}><Plus size={17}/>Add product</button> : undefined}/><div className="card"><div className="toolbar"><div className="search-input"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products or suppliers"/></div><button className="button button-secondary"><MoreHorizontal size={17}/>More filters</button></div>{error && <ErrorState message={error}/>}{loading ? <LoadingState /> : filtered.length ? <ProductTable products={filtered} onEdit={canManage ? (product) => setModal(product) : undefined} onDelete={canManage ? setDeleting : undefined}/> : <div className="empty-state inline"><Package size={22}/><h3>{query ? 'No matching products' : 'No products yet'}</h3><p>{query ? 'Try a different search term.' : 'Add your first product to start tracking inventory.'}</p></div>}</div>{modal && <ProductModal product={modal === 'create' ? undefined : modal} onClose={() => setModal(null)} onSave={save} restricted={store.role === 'manager'}/>}{deleting && <ConfirmModal title="Delete product?" description={`This will remove ${deleting.name} from ${store.name}. This cannot be undone.`} confirm="Delete product" onClose={() => setDeleting(null)} onConfirm={remove}/>}</>;
}
function ProductModal({ product, onClose, onSave, restricted }: {
    product?: Product;
    onClose: () => void;
    onSave: (input: ProductInput, existing?: Product) => Promise<void>;
    restricted: boolean;
}) { const [form, setForm] = useState<ProductInput>({ name: product?.name || '', description: product?.description || '', selling_price: product?.selling_price || '', cost_price: product?.cost_price || '', supplier: product?.supplier || '', stock_quantity: product?.stock_quantity || 0, low_stock_threshold: product?.low_stock_threshold ?? 10 }); const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const update = (key: keyof ProductInput, value: string) => setForm((current) => ({ ...current, [key]: ['selling_price', 'cost_price', 'stock_quantity', 'low_stock_threshold'].includes(String(key)) ? Number(value) : value })); const submit = async (e: FormEvent) => { e.preventDefault(); if (!form.name || Number(form.selling_price) < 0 || Number(form.stock_quantity) < 0) {
    setError('Add a product name and valid non-negative amounts.');
    return;
} setLoading(true); try {
    const input = { ...form };
    if (restricted) {
        delete input.cost_price;
        delete input.supplier;
    }
    await onSave(input, product);
}
catch (err) {
    setError(err instanceof ApiError ? err.message : 'Could not save this product.');
}
finally {
    setLoading(false);
} }; return <Modal title={product ? 'Edit product' : 'Add a product'} onClose={onClose}><form className="stack-form" onSubmit={submit}><label>Product name<input value={String(form.name)} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Jasmine rice"/></label><label>Description<textarea value={String(form.description || '')} onChange={(e) => update('description', e.target.value)} placeholder="A short description" rows={3}/></label><div className="form-grid"><label>Selling price<input type="number" min="0" value={String(form.selling_price)} onChange={(e) => update('selling_price', e.target.value)}/></label><label>Stock quantity<input type="number" min="0" value={String(form.stock_quantity)} onChange={(e) => update('stock_quantity', e.target.value)}/></label><label>Low-stock threshold<input type="number" min="0" value={String(form.low_stock_threshold ?? 10)} onChange={(e) => update('low_stock_threshold', e.target.value)}/></label>{!restricted && <><label>Cost price<input type="number" min="0" value={String(form.cost_price || '')} onChange={(e) => update('cost_price', e.target.value)}/></label><label>Supplier<input value={String(form.supplier || '')} onChange={(e) => update('supplier', e.target.value)}/></label></>}</div>{restricted && <p className="field-note"><ShieldCheck size={14}/> Cost price and supplier are restricted for store managers.</p>}{error && <ErrorState message={error}/>}<div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={loading}>{loading ? <Loader2 className="spin" size={16}/> : null}{product ? 'Save changes' : 'Create product'}</button></div></form></Modal>; }
function UsersPage({ store }: {
    store: Store | null;
}) { const [members, setMembers] = useState<Membership[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [invite, setInvite] = useState(false); const [removing, setRemoving] = useState<Membership | null>(null); const load = async () => { if (!store)
    return; setLoading(true); try {
    setMembers(asList<Membership>(await api.users(store.id)));
}
catch (err) {
    setError(err instanceof ApiError ? err.message : 'Could not load store users.');
}
finally {
    setLoading(false);
} }; useEffect(() => { load(); }, [store?.id]); if (!store)
    return <EmptyStore />; if (store.role !== 'administrator')
    return <div className="permission-state"><ShieldCheck size={25}/><h2>Administrator access required</h2><p>Only administrators can manage store memberships.</p></div>; return <><PageHeader eyebrow="TEAM ACCESS" title="Store users" description={`People with access to ${store.name}.`} action={<button className="button button-primary" onClick={() => setInvite(true)}><Plus size={17}/>Add user</button>}/><div className="card">{error && <ErrorState message={error}/>}{loading ? <LoadingState /> : <div className="members-list">{members.length ? members.map((member) => <div className="member-row" key={member.id}><span className="avatar">{(member.username || member.email || '?').slice(0, 1).toUpperCase()}</span><span className="member-main"><b>{member.username || member.email || 'Store user'}</b><small>{member.email || 'No email available'}</small></span><select value={member.role} onChange={async (e) => { try {
    await api.updateUser(store.id, member.id, { role: e.target.value });
    await load();
}
catch (err) {
    setError(err instanceof ApiError ? err.message : 'Could not update role.');
} }}><option value="staff">Staff</option><option value="manager">Store manager</option><option value="administrator">Administrator</option></select><button className="icon-button danger-hover" onClick={() => setRemoving(member)} aria-label="Remove store user"><Trash2 size={16}/></button></div>) : <div className="empty-state inline"><Users size={22}/><h3>No store users yet</h3><p>Add an existing account to give them access to this store.</p></div>}</div>}</div>{invite && <InviteModal storeId={store.id} onClose={() => setInvite(false)} onSaved={() => { setInvite(false); load(); }}/>}{removing && <ConfirmModal title="Remove store access?" description={`Remove ${removing.username || removing.email || 'this user'} from ${store.name}?`} confirm="Remove access" onClose={() => setRemoving(null)} onConfirm={async () => { await api.removeUser(store.id, removing.id); setRemoving(null); await load(); }}/>}</>; }
function InviteModal({ storeId, onClose, onSaved }: {
    storeId: number;
    onClose: () => void;
    onSaved: () => void;
}) { const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [role, setRole] = useState('staff'); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const submit = async (e: FormEvent) => { e.preventDefault(); setLoading(true); setError(''); try {
    await api.addUser(storeId, { username, password: password || undefined, role });
    onSaved();
}
catch (err) {
    setError(err instanceof ApiError ? err.message : 'Could not add this user.');
}
finally {
    setLoading(false);
} }; return <Modal title="Add a store user" onClose={onClose}><form className="stack-form" onSubmit={submit}><p className="muted">Add an existing account by username, or enter a password to create a new one.</p><label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. priya" required/></label><label>New account password <span className="field-hint">(leave blank for an existing account)</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8}/></label><label>Store role<select value={role} onChange={(e) => setRole(e.target.value)}><option value="staff">Staff</option><option value="manager">Store manager</option><option value="administrator">Administrator</option></select></label>{error && <ErrorState message={error}/>}<div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={loading}>{loading ? 'Adding…' : 'Add user'}</button></div></form></Modal>; }
function AssistantPage({ store }: {
    store: Store | null;
}) { const [messages, setMessages] = useState<{
    role: 'user' | 'assistant';
    text: string;
}[]>([]); const [input, setInput] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const endRef = useRef<HTMLDivElement>(null); useEffect(() => { setMessages([]); setError(''); }, [store?.id]); useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]); const send = async (text = input) => { if (!store || !text.trim() || loading)
    return; const question = text.trim(); setInput(''); setError(''); setMessages((current) => [...current, { role: 'user', text: question }]); setLoading(true); try {
    const result = await api.assistant(store.id, question) as AssistantResponse;
    await new Promise((resolve) => setTimeout(resolve, Math.min(1400, 650 + result.answer.length * 8)));
    setMessages((current) => [...current, { role: 'assistant', text: result.answer }]);
}
catch (err) {
    setError(err instanceof ApiError ? err.message : 'The assistant could not answer right now.');
}
finally {
    setLoading(false);
} }; if (!store)
    return <EmptyStore />; const prompts = ['How many products are in this store?', 'Which products are low in stock?', 'Show all products', 'What is the total stock quantity?']; return <div className="assistant-page"><PageHeader eyebrow="STORE INTELLIGENCE" title="AI assistant" description={`Ask about products and inventory in ${store.name}.`}/><div className="chat-card card"><div className="chat-context"><span className="assistant-orb small"><MessageSquare size={16}/></span><span><b>Store assistant</b><small>Grounded in {store.name} data</small></span><span className="live-dot">Ready</span></div><div className="chat-body">{!messages.length ? <div className="chat-welcome"><span className="assistant-orb"><MessageSquare size={22}/></span><h2>What would you like to know?</h2><p>I can help with product counts, stock levels, and selling prices for this store.</p><div className="prompt-grid">{prompts.map((prompt) => <button key={prompt} onClick={() => send(prompt)}>{prompt}<ArrowRight size={14}/></button>)}</div></div> : <div className="messages">{messages.map((message, index) => <div className={`message-row ${message.role}`} key={`${message.role}-${index}`}><span className="message-avatar">{message.role === 'assistant' ? <MessageSquare size={14}/> : 'Y'}</span><div className="message-bubble">{message.text}</div></div>)}{loading && <div className="message-row assistant"><span className="message-avatar"><MessageSquare size={14}/></span><div className="typing"><i /><i /><i /></div></div>}<div ref={endRef}/></div>}{error && <div className="chat-error"><AlertTriangle size={15}/>{error}<button onClick={() => send(messages[messages.length - 1]?.text || '')}>Retry</button></div>}</div><form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about this store…" disabled={loading}/><button className="button button-primary" disabled={!input.trim() || loading} aria-label="Send message"><Send size={17}/></button></form></div></div>; }
function Modal({ title, onClose, children }: {
    title: string;
    onClose: () => void;
    children: ReactNode;
}) { return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-header"><h2 id="modal-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button></div>{children}</div></div>; }
function ConfirmModal({ title, description, confirm, onClose, onConfirm }: {
    title: string;
    description: string;
    confirm: string;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
}) { const [loading, setLoading] = useState(false); return <Modal title={title} onClose={onClose}><p className="modal-description">{description}</p><div className="modal-actions"><button className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-danger" disabled={loading} onClick={async () => { setLoading(true); await onConfirm(); setLoading(false); }}>{loading ? 'Working…' : confirm}</button></div></Modal>; }
function App() { const [user, setUser] = useState<User | null>(null); const [stores, setStores] = useState<Store[]>([]); const [selectedStore, setSelectedStore] = useState<Store | null>(null); const [checking, setChecking] = useState(true); useEffect(() => { api.me().then(async (data) => { const auth = data as AuthMe; const available = auth.stores || asList<Store>(await api.stores()); setUser(auth.user); setStores(available); setSelectedStore(available[0] || null); }).catch(() => { }).finally(() => setChecking(false)); }, []); const logout = async () => { await api.logout().catch(() => { }); setUser(null); setStores([]); setSelectedStore(null); }; if (checking)
    return <div className="app-loading"><Brand /><Loader2 className="spin" size={20}/></div>; return <BrowserRouter>{user ? <Routes><Route element={<AppLayout user={user} stores={stores} selectedStore={selectedStore} onStoreChange={setSelectedStore} onLogout={logout}/>}><Route element={<RequireStore store={selectedStore}/>}><Route path="/" element={<DashboardPage store={selectedStore}/>}/><Route path="/products" element={<ProductsPage store={selectedStore}/>}/><Route path="/users" element={<UsersPage store={selectedStore}/>}/><Route path="/assistant" element={<AssistantPage store={selectedStore}/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Route></Routes> : <Routes><Route path="*" element={<LoginPage onLogin={(nextUser, nextStores) => { setUser(nextUser); setStores(nextStores); setSelectedStore(nextStores[0] || null); }}/>}/></Routes>}</BrowserRouter>; }
function RequireStore({ store }: {
    store: Store | null;
}) { return store ? <Outlet /> : <div><EmptyStore /></div>; }
export default App;
