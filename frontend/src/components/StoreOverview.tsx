import React, { FC, FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart2,
  Boxes,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Filter,
  Layers,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShoppingBag,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
  Edit3,
  Trash2,
} from 'lucide-react';
import { api, ApiError, asList } from '@/lib/api';
import type { AssistantResponse, Product, Store } from '@/types';

// Helper for Sri Lankan Rupee formatting
export const money = (value: number | string) =>
  `Rs. ${Number(value || 0).toLocaleString('en-LK', { maximumFractionDigits: 2 })}`;

export interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const PageHeader: FC<PageHeaderProps> = ({ eyebrow, title, description, action }) => (
  <div className="page-header">
    <div>
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      {description && <p className="muted page-description">{description}</p>}
    </div>
    {action}
  </div>
);

export interface MetricProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  accent?: string;
  subtext?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
  onClick?: () => void;
  active?: boolean;
}

export const Metric: FC<MetricProps> = ({
  icon,
  label,
  value,
  accent = 'neutral',
  subtext,
  trend,
  onClick,
  active = false,
}) => (
  <div
    className={`metric-card ${onClick ? 'metric-card-interactive' : ''} ${active ? 'active' : ''}`}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={(e) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick();
      }
    }}
  >
    <div className="metric-header-row">
      <span className={`metric-icon ${accent}`}>{icon}</span>
      {trend && (
        <span className={`metric-trend-badge ${trend.direction}`}>
          {trend.direction === 'up' && <TrendingUp size={12} />}
          {trend.direction === 'down' && <TrendingDown size={12} />}
          <span>{trend.label}</span>
        </span>
      )}
    </div>
    <span className="metric-label">{label}</span>
    <strong>{value}</strong>
    {subtext && <small className="metric-subtext">{subtext}</small>}
  </div>
);

export interface ProductTableProps {
  products: Product[];
  compact?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onSelect?: (product: Product) => void;
  emptyMessage?: string;
}

export const ProductTable: FC<ProductTableProps> = ({
  products,
  compact = false,
  onEdit,
  onDelete,
  onSelect,
  emptyMessage = 'No products match your criteria.',
}) => {
  if (products.length === 0) {
    return (
      <div className="table-empty-notice">
        <Package size={22} className="muted" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="overview-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Selling Price</th>
            <th>Stock Status</th>
            {!compact && <th>Supplier</th>}
            {!compact && (onEdit || onDelete) && <th aria-label="Actions">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const threshold = product.low_stock_threshold ?? 5;
            const isZero = Number(product.stock_quantity) === 0;
            const isLow = Number(product.stock_quantity) <= threshold;

            return (
              <tr
                key={product.id}
                onClick={() => onSelect?.(product)}
                className={onSelect ? 'clickable-row' : ''}
              >
                <td>
                  <div className="product-name">
                    <span
                      className={`product-avatar ${isZero ? 'avatar-danger' : isLow ? 'avatar-warning' : 'avatar-normal'}`}
                    >
                      {product.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <b>{product.name}</b>
                      {product.description && <small>{product.description}</small>}
                    </div>
                  </div>
                </td>
                <td>
                  <span className="price-tag">{money(product.selling_price)}</span>
                </td>
                <td>
                  <span
                    className={`stock-badge ${
                      isZero ? 'out-of-stock' : isLow ? 'warning' : 'healthy'
                    }`}
                  >
                    {isZero
                      ? '0 units (Depleted)'
                      : `${product.stock_quantity} units ${isLow ? '(Low)' : ''}`}
                  </span>
                </td>
                {!compact && <td>{product.supplier || '—'}</td>}
                {!compact && (onEdit || onDelete) && (
                  <td>
                    <div className="row-actions">
                      {onEdit && (
                        <button
                          type="button"
                          className="icon-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(product);
                          }}
                          aria-label={`Edit ${product.name}`}
                        >
                          <Edit3 size={15} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          className="icon-button danger-hover"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(product);
                          }}
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export const LoadingState: FC<{ message?: string }> = ({ message = 'Loading store data…' }) => (
  <div className="loading-state">
    <RefreshCw className="spin" size={20} />
    <span>{message}</span>
  </div>
);

export const ErrorState: FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="alert alert-danger" role="alert">
    <AlertTriangle size={18} />
    <div className="alert-content">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="retry-link" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  </div>
);

// Types of filter selection for inventory
type FilterType = 'all' | 'low' | 'out_of_stock' | 'healthy' | 'high_value';
type ChartMetricType = 'valuation' | 'quantity';

export interface StoreOverviewProps {
  store: Store | null;
  onAddProduct?: () => void;
  onEditProduct?: (product: Product) => void;
}

export const StoreOverview: FC<StoreOverviewProps> = ({
  store,
  onAddProduct,
  onEditProduct,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Interactive controls
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'stock_asc' | 'stock_desc' | 'value_desc' | 'name_asc'>('stock_asc');
  const [chartMetric, setChartMetric] = useState<ChartMetricType>('valuation');
  const [selectedChartProduct, setSelectedChartProduct] = useState<Product | null>(null);

  // Selected metric card for contextual notification alert (null on initial stage!)
  const [selectedMetric, setSelectedMetric] = useState<'catalog' | 'volume' | 'attention' | 'value' | null>(null);

  // Assistant Widget State
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<
    Array<{ role: 'user' | 'assistant'; text: string; timestamp?: string }>
  >([]);
  const [assistantError, setAssistantError] = useState('');
  const assistantBottomRef = useRef<HTMLDivElement>(null);

  // Pre-configured intelligent prompts
  const suggestedPrompts = [
    'Which products are low in stock?',
    'What is the total stock quantity?',
    'How many products are in this store?',
    'Show all products',
    'What products are priced over Rs. 50,000?',
    'Which products are running low?',
  ];

  // Dynamic typing suggestions based on user input
  const typingSuggestions = useMemo(() => {
    const query = assistantInput.trim().toLowerCase();
    if (!query) return [];
    return suggestedPrompts.filter((p) => p.toLowerCase().includes(query)).slice(0, 3);
  }, [assistantInput]);

  // Initial assistant welcome message helper
  const getInitialMessages = (storeName: string) => [
    {
      role: 'assistant' as const,
      text: `Hello! I'm your MallDesk assistant for ${storeName}. Ask me anything about stock quantities, low-stock reorders, or selling prices.`,
      timestamp: 'Just now',
    },
  ];

  // Fetch products from existing API
  const loadProducts = async (isManualRefresh = false) => {
    if (!store) {
      setProducts([]);
      setLoading(false);
      return;
    }

    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const data = await api.products(store.id);
      setProducts(asList<Product>(data));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load store products.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
    if (store) {
      setAssistantMessages(getInitialMessages(store.name));
    }
    setSelectedMetric(null);
  }, [store?.id]);

  useEffect(() => {
    assistantBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [assistantMessages, assistantLoading]);

  // Metric card click handler
  const handleMetricClick = (metricKey: 'catalog' | 'volume' | 'attention' | 'value') => {
    if (selectedMetric === metricKey) {
      setSelectedMetric(null);
      return;
    }
    setSelectedMetric(metricKey);

    if (metricKey === 'catalog') {
      setFilterType('all');
    } else if (metricKey === 'volume') {
      setSortBy('stock_desc');
      setChartMetric('quantity');
    } else if (metricKey === 'attention') {
      setFilterType(stats.outOfStock.length > 0 ? 'out_of_stock' : 'low');
      setSortBy('stock_asc');
    } else if (metricKey === 'value') {
      setSortBy('value_desc');
      setChartMetric('valuation');
    }
  };

  // Derived real data calculations (Zero invented fields)
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalUnits = products.reduce((acc, p) => acc + (Number(p.stock_quantity) || 0), 0);
    const catalogValue = products.reduce(
      (acc, p) => acc + (Number(p.selling_price) || 0) * (Number(p.stock_quantity) || 0),
      0
    );

    const outOfStock = products.filter((p) => Number(p.stock_quantity) === 0);
    const lowStock = products.filter(
      (p) =>
        Number(p.stock_quantity) > 0 &&
        Number(p.stock_quantity) <= (p.low_stock_threshold ?? 5)
    );
    const healthyStock = products.filter(
      (p) => Number(p.stock_quantity) > (p.low_stock_threshold ?? 5)
    );

    const avgPrice =
      totalProducts > 0
        ? products.reduce((acc, p) => acc + Number(p.selling_price || 0), 0) / totalProducts
        : 0;

    // Supplier metrics
    const suppliers = Array.from(
      new Set(products.map((p) => p.supplier?.trim()).filter(Boolean))
    ) as string[];

    // Top products by valuation
    const sortedByValue = [...products].sort((a, b) => {
      const valA = Number(a.selling_price || 0) * Number(a.stock_quantity || 0);
      const valB = Number(b.selling_price || 0) * Number(b.stock_quantity || 0);
      return valB - valA;
    });

    // Top products by stock quantity
    const sortedByUnits = [...products].sort(
      (a, b) => Number(b.stock_quantity || 0) - Number(a.stock_quantity || 0)
    );

    return {
      totalProducts,
      totalUnits,
      catalogValue,
      outOfStock,
      lowStock,
      healthyStock,
      attentionRequired: outOfStock.length + lowStock.length,
      avgPrice,
      suppliersCount: suppliers.length,
      sortedByValue,
      sortedByUnits,
    };
  }, [products]);

  // Filtered and sorted products for the table
  const displayedProducts = useMemo(() => {
    let list = [...products];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.supplier && p.supplier.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Category / status filter
    if (filterType === 'low') {
      list = list.filter(
        (p) =>
          Number(p.stock_quantity) > 0 &&
          Number(p.stock_quantity) <= (p.low_stock_threshold ?? 5)
      );
    } else if (filterType === 'out_of_stock') {
      list = list.filter((p) => Number(p.stock_quantity) === 0);
    } else if (filterType === 'healthy') {
      list = list.filter((p) => Number(p.stock_quantity) > (p.low_stock_threshold ?? 5));
    } else if (filterType === 'high_value') {
      list = list.filter((p) => Number(p.selling_price || 0) >= 5000);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'stock_asc') {
        return Number(a.stock_quantity || 0) - Number(b.stock_quantity || 0);
      }
      if (sortBy === 'stock_desc') {
        return Number(b.stock_quantity || 0) - Number(a.stock_quantity || 0);
      }
      if (sortBy === 'value_desc') {
        const valA = Number(a.selling_price || 0) * Number(a.stock_quantity || 0);
        const valB = Number(b.selling_price || 0) * Number(b.stock_quantity || 0);
        return valB - valA;
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [products, filterType, searchQuery, sortBy]);

  // Assistant interaction handler
  const handleAssistantSend = async (customPrompt?: string) => {
    const messageText = (customPrompt || assistantInput).trim();
    if (!store || !messageText || assistantLoading) return;

    setAssistantInput('');
    setAssistantError('');
    setAssistantMessages((prev) => [
      ...prev,
      {
        role: 'user',
        text: messageText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setAssistantLoading(true);

    try {
      const response = (await api.assistant(store.id, messageText)) as AssistantResponse;
      // Realistic brief delay for natural feeling
      await new Promise((resolve) => setTimeout(resolve, Math.min(800, 300 + response.answer.length * 4)));
      setAssistantMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: response.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setAssistantError(
        err instanceof ApiError ? err.message : 'Assistant query failed. Check connection.'
      );
    } finally {
      setAssistantLoading(false);
    }
  };

  if (!store) {
    return (
      <div className="empty-state">
        <span className="empty-icon">
          <ShoppingBag size={22} />
        </span>
        <h3>Select a store to view overview</h3>
        <p>Choose your active store from the top switcher to inspect catalog performance.</p>
      </div>
    );
  }

  return (
    <div className="store-overview-container">
      {/* 1. Header with SaaS action group */}
      <PageHeader
        eyebrow="STORE OVERVIEW & INTELLIGENCE"
        title={`Good to see you, ${store.name}.`}
        description="Real-time catalog performance, inventory health, and assistant intelligence."
        action={
          <div className="header-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => loadProducts(true)}
              disabled={refreshing || loading}
              title="Refresh inventory data"
            >
              <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
              <span>{refreshing ? 'Refreshing…' : 'Sync Data'}</span>
            </button>
            <Link
              to="/products"
              className="button button-primary"
              onClick={() => onAddProduct?.()}
            >
              <Plus size={16} />
              <span>Add Product</span>
            </Link>
          </div>
        }
      />

      {error && <ErrorState message={error} onRetry={() => loadProducts()} />}

      {loading ? (
        <LoadingState message="Fetching store products and stock metrics…" />
      ) : (
        <>
          {/* 2. Intelligent Contextual Alert Section - Only shown when a metric card is clicked */}
          {selectedMetric === 'catalog' && (
            <div className="overview-alert overview-alert-info">
              <div className="overview-alert-icon">
                <Package size={20} />
              </div>
              <div className="overview-alert-body">
                <div className="overview-alert-title">
                  <b>Catalog Inventory: {stats.totalProducts} Active Products</b>
                  <span className="overview-alert-badge">Catalog View</span>
                </div>
                <p className="overview-alert-desc">
                  Showing all active products across {stats.suppliersCount} suppliers. Filter reset to display complete inventory catalog.
                </p>
                <div className="overview-alert-actions">
                  <Link to="/products" className="alert-pill-button">
                    Open Catalog Manager <ArrowRight size={13} />
                  </Link>
                  <button
                    type="button"
                    className="alert-pill-button-secondary"
                    onClick={() => setSelectedMetric(null)}
                  >
                    Dismiss Alert
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="icon-button alert-close-button"
                onClick={() => setSelectedMetric(null)}
                aria-label="Dismiss alert"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {selectedMetric === 'volume' && (
            <div className="overview-alert overview-alert-info">
              <div className="overview-alert-icon">
                <Boxes size={20} />
              </div>
              <div className="overview-alert-body">
                <div className="overview-alert-title">
                  <b>Total Stock Volume: {stats.totalUnits.toLocaleString()} Units</b>
                  <span className="overview-alert-badge">Volume View</span>
                </div>
                <p className="overview-alert-desc">
                  Holding {stats.totalUnits.toLocaleString()} total physical units in store. Average SKU holding is {stats.totalProducts ? Math.round(stats.totalUnits / stats.totalProducts) : 0} units. Table sorted by highest stock volume.
                </p>
                <div className="overview-alert-actions">
                  <button
                    type="button"
                    className="alert-pill-button"
                    onClick={() => setChartMetric('quantity')}
                  >
                    View Units in Chart <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    className="alert-pill-button-secondary"
                    onClick={() => setSelectedMetric(null)}
                  >
                    Dismiss Alert
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="icon-button alert-close-button"
                onClick={() => setSelectedMetric(null)}
                aria-label="Dismiss alert"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {selectedMetric === 'attention' && (
            <div
              className={`overview-alert ${
                stats.outOfStock.length > 0 ? 'overview-alert-danger' : 'overview-alert-warning'
              }`}
            >
              <div className="overview-alert-icon">
                {stats.outOfStock.length > 0 ? <AlertCircle size={20} /> : <AlertTriangle size={20} />}
              </div>
              <div className="overview-alert-body">
                <div className="overview-alert-title">
                  <b>
                    {stats.outOfStock.length > 0
                      ? `${stats.outOfStock.length} Product${stats.outOfStock.length > 1 ? 's' : ''} Depleted (0 Stock)`
                      : `${stats.lowStock.length} Product${stats.lowStock.length > 1 ? 's' : ''} Running Low`}
                  </b>
                  <span className="overview-alert-badge">Action Required</span>
                </div>
                <p className="overview-alert-desc">
                  {stats.outOfStock.length > 0
                    ? `Immediate reorder recommended for ${stats.outOfStock.map((p) => p.name).slice(0, 3).join(', ')}${
                        stats.outOfStock.length > 3 ? ` and ${stats.outOfStock.length - 3} more` : ''
                      }.`
                    : `Stock is at or below threshold for ${stats.lowStock.map((p) => `${p.name} (${p.stock_quantity})`).slice(0, 3).join(', ')}.`}
                </p>
                <div className="overview-alert-actions">
                  <button
                    type="button"
                    className="alert-pill-button"
                    onClick={() => handleAssistantSend('Which products are low in stock?')}
                  >
                    Ask Assistant to summarize <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    className="alert-pill-button-secondary"
                    onClick={() => setSelectedMetric(null)}
                  >
                    Dismiss Alert
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="icon-button alert-close-button"
                onClick={() => setSelectedMetric(null)}
                aria-label="Dismiss alert"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {selectedMetric === 'value' && (
            <div className="overview-alert overview-alert-info">
              <div className="overview-alert-icon">
                <ShoppingBag size={20} />
              </div>
              <div className="overview-alert-body">
                <div className="overview-alert-title">
                  <b>Gross Catalog Asset Valuation: {money(stats.catalogValue)}</b>
                  <span className="overview-alert-badge">Financial Value</span>
                </div>
                <p className="overview-alert-desc">
                  Calculated across {stats.totalUnits.toLocaleString()} units at active retail prices. Average unit price: {money(stats.avgPrice)}. Table sorted by highest valuation.
                </p>
                <div className="overview-alert-actions">
                  <button
                    type="button"
                    className="alert-pill-button"
                    onClick={() => setChartMetric('valuation')}
                  >
                    View Valuation in Chart <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    className="alert-pill-button-secondary"
                    onClick={() => setSelectedMetric(null)}
                  >
                    Dismiss Alert
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="icon-button alert-close-button"
                onClick={() => setSelectedMetric(null)}
                aria-label="Dismiss alert"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* 3. Interactive KPI Metrics Grid using existing Metric component */}
          <section className="metric-grid">
            <Metric
              icon={<Package size={18} />}
              label="Total Catalog Items"
              value={stats.totalProducts}
              accent="orange"
              subtext={`${stats.suppliersCount} active suppliers`}
              active={selectedMetric === 'catalog'}
              onClick={() => handleMetricClick('catalog')}
              trend={{
                direction: 'neutral',
                label: 'Active SKUs',
              }}
            />
            <Metric
              icon={<Boxes size={18} />}
              label="Total Stock Volume"
              value={stats.totalUnits.toLocaleString()}
              accent="neutral"
              subtext={`Avg. ${
                stats.totalProducts ? Math.round(stats.totalUnits / stats.totalProducts) : 0
              } units/SKU`}
              active={selectedMetric === 'volume'}
              onClick={() => handleMetricClick('volume')}
              trend={{
                direction: stats.totalUnits > 50 ? 'up' : 'down',
                label: `${stats.totalUnits} Units`,
              }}
            />
            <Metric
              icon={<AlertTriangle size={18} />}
              label="Stock Attention Items"
              value={stats.attentionRequired}
              accent={stats.attentionRequired > 0 ? 'warning' : 'green'}
              subtext={
                stats.outOfStock.length > 0
                  ? `${stats.outOfStock.length} out of stock`
                  : stats.lowStock.length > 0
                  ? `${stats.lowStock.length} near threshold`
                  : 'All items healthy'
              }
              active={selectedMetric === 'attention'}
              onClick={() => handleMetricClick('attention')}
              trend={{
                direction: stats.attentionRequired > 0 ? 'down' : 'up',
                label: stats.attentionRequired > 0 ? 'Needs Attention' : 'Healthy',
              }}
            />
            <Metric
              icon={<ShoppingBag size={18} />}
              label="Gross Catalog Value"
              value={money(stats.catalogValue)}
              accent="orange"
              subtext={`Avg. price ${money(stats.avgPrice)}`}
              active={selectedMetric === 'value'}
              onClick={() => handleMetricClick('value')}
              trend={{
                direction: 'up',
                label: 'At Selling Price',
              }}
            />
          </section>

          {/* 4. Real Data SaaS Charts Section */}
          <div className="charts-grid">
            {/* Chart A: Top Products Valuation & Volume */}
            <section className="card chart-card">
              <div className="card-header">
                <div>
                  <div className="chart-title-wrap">
                    <h2>Catalog Concentration</h2>
                    <span className="saas-pill">Real Data</span>
                  </div>
                  <p>Top products by catalog asset valuation and stock volume.</p>
                </div>
                <div className="chart-metric-toggle">
                  <button
                    type="button"
                    className={`toggle-option ${chartMetric === 'valuation' ? 'active' : ''}`}
                    onClick={() => setChartMetric('valuation')}
                  >
                    Valuation (Rs)
                  </button>
                  <button
                    type="button"
                    className={`toggle-option ${chartMetric === 'quantity' ? 'active' : ''}`}
                    onClick={() => setChartMetric('quantity')}
                  >
                    Units
                  </button>
                </div>
              </div>

              <div className="chart-body">
                {products.length === 0 ? (
                  <div className="chart-empty">No products available to chart.</div>
                ) : (
                  <div className="svg-bar-chart">
                    {(() => {
                      const displayItems =
                        chartMetric === 'valuation'
                          ? stats.sortedByValue.slice(0, 5)
                          : stats.sortedByUnits.slice(0, 5);

                      const maxValue = Math.max(
                        ...displayItems.map((p) =>
                          chartMetric === 'valuation'
                            ? Number(p.selling_price || 0) * Number(p.stock_quantity || 0)
                            : Number(p.stock_quantity || 0)
                        ),
                        1
                      );

                      return displayItems.map((product, idx) => {
                        const itemValuation =
                          Number(product.selling_price || 0) * Number(product.stock_quantity || 0);
                        const rawMetricValue =
                          chartMetric === 'valuation' ? itemValuation : Number(product.stock_quantity || 0);
                        const percentOfMax = Math.min(100, Math.round((rawMetricValue / maxValue) * 100));
                        const shareOfTotal =
                          chartMetric === 'valuation' && stats.catalogValue > 0
                            ? Math.round((itemValuation / stats.catalogValue) * 100)
                            : stats.totalUnits > 0
                            ? Math.round((Number(product.stock_quantity || 0) / stats.totalUnits) * 100)
                            : 0;

                        const isSelected = selectedChartProduct?.id === product.id;

                        return (
                          <div
                            key={product.id}
                            className={`chart-row ${isSelected ? 'chart-row-active' : ''}`}
                            onClick={() =>
                              setSelectedChartProduct(isSelected ? null : product)
                            }
                            role="button"
                            tabIndex={0}
                            title={`Click to focus ${product.name}`}
                          >
                            <div className="chart-row-meta">
                              <span className="chart-rank">#{idx + 1}</span>
                              <span className="chart-product-name" title={product.name}>
                                {product.name}
                              </span>
                              <span className="chart-supplier-tag">
                                {product.supplier || 'Store catalog'}
                              </span>
                              <span className="chart-value-label">
                                {chartMetric === 'valuation'
                                  ? money(itemValuation)
                                  : `${product.stock_quantity} units`}
                              </span>
                            </div>

                            <div className="chart-bar-container">
                              <div
                                className="chart-bar-fill"
                                style={{
                                  width: `${Math.max(percentOfMax, 4)}%`,
                                }}
                              />
                              <span className="chart-share-text">{shareOfTotal}% share</span>
                            </div>

                            {isSelected && (
                              <div className="chart-inline-tooltip">
                                <span>Unit Price: <b>{money(product.selling_price)}</b></span>
                                <span>Stock: <b>{product.stock_quantity} units</b></span>
                                <span>Valuation: <b>{money(itemValuation)}</b></span>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </section>

            {/* Chart B: Stock Health & Inventory Status Distribution */}
            <section className="card chart-card">
              <div className="card-header">
                <div>
                  <div className="chart-title-wrap">
                    <h2>Inventory Health Breakdown</h2>
                    <span className="saas-pill">Real Distribution</span>
                  </div>
                  <p>Stock distribution across minimum safety thresholds.</p>
                </div>
              </div>

              <div className="chart-body health-chart-body">
                {products.length === 0 ? (
                  <div className="chart-empty">No products recorded.</div>
                ) : (
                  <>
                    {/* Visual Segmented Bar */}
                    <div className="health-segmented-track" title="Catalog Health Distribution">
                      <div
                        className="health-segment healthy"
                        style={{
                          width: `${(stats.healthyStock.length / stats.totalProducts) * 100}%`,
                        }}
                      />
                      <div
                        className="health-segment warning"
                        style={{
                          width: `${(stats.lowStock.length / stats.totalProducts) * 100}%`,
                        }}
                      />
                      <div
                        className="health-segment danger"
                        style={{
                          width: `${(stats.outOfStock.length / stats.totalProducts) * 100}%`,
                        }}
                      />
                    </div>

                    {/* Interactive Status Distribution Cards */}
                    <div className="health-stat-cards">
                      <div
                        className={`health-pill-card healthy ${
                          filterType === 'healthy' ? 'active' : ''
                        }`}
                        onClick={() =>
                          setFilterType(filterType === 'healthy' ? 'all' : 'healthy')
                        }
                        role="button"
                        tabIndex={0}
                      >
                        <div className="health-pill-header">
                          <span className="health-dot healthy" />
                          <span>Adequate Stock</span>
                        </div>
                        <div className="health-pill-values">
                          <strong>{stats.healthyStock.length}</strong>
                          <small>
                            {Math.round(
                              (stats.healthyStock.length / (stats.totalProducts || 1)) * 100
                            )}
                            % of catalog
                          </small>
                        </div>
                        <span className="health-pill-hint">Click to filter</span>
                      </div>

                      <div
                        className={`health-pill-card warning ${
                          filterType === 'low' ? 'active' : ''
                        }`}
                        onClick={() =>
                          setFilterType(filterType === 'low' ? 'all' : 'low')
                        }
                        role="button"
                        tabIndex={0}
                      >
                        <div className="health-pill-header">
                          <span className="health-dot warning" />
                          <span>Low Stock (&le; 5)</span>
                        </div>
                        <div className="health-pill-values">
                          <strong>{stats.lowStock.length}</strong>
                          <small>
                            {Math.round(
                              (stats.lowStock.length / (stats.totalProducts || 1)) * 100
                            )}
                            % of catalog
                          </small>
                        </div>
                        <span className="health-pill-hint">Click to filter</span>
                      </div>

                      <div
                        className={`health-pill-card danger ${
                          filterType === 'out_of_stock' ? 'active' : ''
                        }`}
                        onClick={() =>
                          setFilterType(filterType === 'out_of_stock' ? 'all' : 'out_of_stock')
                        }
                        role="button"
                        tabIndex={0}
                      >
                        <div className="health-pill-header">
                          <span className="health-dot danger" />
                          <span>Out of Stock</span>
                        </div>
                        <div className="health-pill-values">
                          <strong>{stats.outOfStock.length}</strong>
                          <small>
                            {Math.round(
                              (stats.outOfStock.length / (stats.totalProducts || 1)) * 100
                            )}
                            % of catalog
                          </small>
                        </div>
                        <span className="health-pill-hint">Click to filter</span>
                      </div>
                    </div>

                    {/* Quick supplier share overview */}
                    <div className="supplier-share-box">
                      <span className="supplier-share-title">
                        <Layers size={13} />
                        <b>Active Suppliers ({stats.suppliersCount})</b>
                      </span>
                      <div className="supplier-tags-wrap">
                        {Array.from(
                          new Set(products.map((p) => p.supplier?.trim()).filter(Boolean))
                        )
                          .slice(0, 4)
                          .map((sup) => {
                            const count = products.filter((p) => p.supplier?.trim() === sup).length;
                            return (
                              <span key={sup as string} className="supplier-chip">
                                <b>{sup as string}</b> ({count})
                              </span>
                            );
                          })}
                        {stats.suppliersCount > 4 && (
                          <span className="supplier-chip muted">
                            +{stats.suppliersCount - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>

          {/* 5. Main Content: Interactive Product Table & Assistant Panel */}
          <div className="overview-main-grid">
            {/* Left: Interactive Inventory Table */}
            <section className="card overview-table-card">
              <div className="card-header">
                <div>
                  <div className="table-title-row">
                    <h2>Catalog Inventory Focus</h2>
                    <span className="items-count-badge">
                      {displayedProducts.length} product{displayedProducts.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p>
                    Showing {filterType === 'all' ? 'all active items' : filterType.replace('_', ' ')} sorted
                    by{' '}
                    {sortBy === 'stock_asc'
                      ? 'lowest stock first'
                      : sortBy === 'value_desc'
                      ? 'highest valuation'
                      : sortBy === 'stock_desc'
                      ? 'highest stock'
                      : 'alphabetical'}.
                  </p>
                </div>
                <Link to="/products" className="text-link">
                  Open Catalog Manager <ArrowRight size={15} />
                </Link>
              </div>

              {/* Interactive Toolbar */}
              <div className="overview-toolbar">
                {/* Search Bar */}
                <div className="search-input">
                  <Search size={16} />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by product name or supplier…"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="clear-search"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filter Chips */}
                <div className="filter-chips-row">
                  <button
                    type="button"
                    className={`filter-chip ${filterType === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterType('all')}
                  >
                    All ({stats.totalProducts})
                  </button>
                  <button
                    type="button"
                    className={`filter-chip warning ${filterType === 'low' ? 'active' : ''}`}
                    onClick={() => setFilterType('low')}
                  >
                    Low Stock ({stats.lowStock.length})
                  </button>
                  <button
                    type="button"
                    className={`filter-chip danger ${
                      filterType === 'out_of_stock' ? 'active' : ''
                    }`}
                    onClick={() => setFilterType('out_of_stock')}
                  >
                    Depleted ({stats.outOfStock.length})
                  </button>
                  <button
                    type="button"
                    className={`filter-chip healthy ${filterType === 'healthy' ? 'active' : ''}`}
                    onClick={() => setFilterType('healthy')}
                  >
                    Healthy ({stats.healthyStock.length})
                  </button>
                </div>

                {/* Sort Selector */}
                <div className="sort-select-wrapper">
                  <SlidersHorizontal size={14} className="sort-icon" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="overview-sort-select"
                    aria-label="Sort products"
                  >
                    <option value="stock_asc">Stock: Low to High</option>
                    <option value="stock_desc">Stock: High to Low</option>
                    <option value="value_desc">Valuation: High to Low</option>
                    <option value="name_asc">Name: A to Z</option>
                  </select>
                </div>
              </div>

              {/* Render ProductTable with existing component */}
              <ProductTable
                products={displayedProducts.slice(0, 8)}
                compact
                onSelect={(prod) => onEditProduct?.(prod)}
                emptyMessage={
                  searchQuery
                    ? `No products found matching "${searchQuery}".`
                    : filterType !== 'all'
                    ? `No products currently in "${filterType.replace('_', ' ')}" status.`
                    : 'No products in this store yet.'
                }
              />

              {displayedProducts.length > 8 && (
                <div className="table-footer-bar">
                  <span>
                    Showing 8 of {displayedProducts.length} filtered items
                  </span>
                  <Link to="/products" className="text-link">
                    View all in Products catalog <ArrowUpRight size={14} />
                  </Link>
                </div>
              )}
            </section>

            {/* Right: Embedded SaaS AI Store Assistant */}
            <section className="card assistant-widget-card">
              <div className="assistant-widget-header">
                <div className="assistant-header-main">
                  <span className="assistant-orb small">
                    <MessageSquare size={16} />
                  </span>
                  <div>
                    <div className="eyebrow">STORE ASSISTANT</div>
                    <h3>MallDesk Intelligence</h3>
                  </div>
                </div>
                <span className="live-status-pill">
                  <span className="live-dot-ping" />
                  Live
                </span>
              </div>

              <div className="assistant-widget-context">
                <small>Grounded exclusively in {store.name} data.</small>
              </div>

              {/* Chat Body */}
              <div className="assistant-widget-body">
                <div className="assistant-widget-messages">
                  {assistantMessages.map((msg, index) => (
                    <div
                      key={`${msg.role}-${index}`}
                      className={`widget-message-row ${msg.role}`}
                    >
                      <span className="widget-message-avatar">
                        {msg.role === 'assistant' ? <MessageSquare size={13} /> : 'You'}
                      </span>
                      <div className="widget-message-bubble">
                        <p>{msg.text}</p>
                        {msg.timestamp && (
                          <span className="widget-message-time">{msg.timestamp}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {assistantLoading && (
                    <div className="widget-message-row assistant">
                      <span className="widget-message-avatar">
                        <MessageSquare size={13} />
                      </span>
                      <div className="widget-typing-indicator">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  )}

                  {/* Contextual Quick Followup Prompts */}
                  {!assistantLoading && (
                    <div className="assistant-followup-chips">
                      <button
                        type="button"
                        className="followup-chip"
                        onClick={() => handleAssistantSend('Which products are low in stock?')}
                      >
                        Low stock items
                      </button>
                      <button
                        type="button"
                        className="followup-chip"
                        onClick={() => handleAssistantSend('What is the total stock quantity?')}
                      >
                        Total stock
                      </button>
                      <button
                        type="button"
                        className="followup-chip"
                        onClick={() => handleAssistantSend('Show all products')}
                      >
                        All products
                      </button>
                    </div>
                  )}

                  <div ref={assistantBottomRef} />
                </div>

                {assistantError && (
                  <div className="widget-error-bar">
                    <AlertCircle size={14} />
                    <span>{assistantError}</span>
                  </div>
                )}
              </div>

              {/* Dynamic Suggestions When Typing */}
              {typingSuggestions.length > 0 && (
                <div className="assistant-typeahead-suggestions">
                  <span className="typeahead-title">Suggested questions:</span>
                  {typingSuggestions.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="typeahead-chip"
                      onClick={() => {
                        setAssistantInput(prompt);
                        handleAssistantSend(prompt);
                      }}
                    >
                      <span>{prompt}</span>
                      <ArrowRight size={12} />
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Input */}
              <form
                className="assistant-widget-form"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  handleAssistantSend();
                }}
              >
                <input
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  placeholder="Ask a question about this store…"
                  disabled={assistantLoading}
                />
                <button
                  type="submit"
                  className="button button-primary widget-send-btn"
                  disabled={!assistantInput.trim() || assistantLoading}
                  aria-label="Send query"
                >
                  <Send size={15} />
                </button>
              </form>

              <div className="assistant-widget-footer">
                <Link to="/assistant" className="text-link">
                  Open full-screen assistant <ArrowRight size={13} />
                </Link>
                {assistantMessages.length > 1 && (
                  <button
                    type="button"
                    className="clear-chat-btn"
                    onClick={() => setAssistantMessages(getInitialMessages(store.name))}
                  >
                    Reset chat
                  </button>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default StoreOverview;
