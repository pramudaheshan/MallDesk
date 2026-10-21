import type { AssistantResponse, AuthMe, Membership, Product, Store } from '@/types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
let csrfToken: string | null = null;

export class ApiError extends Error {
    status: number;
    details: unknown;

    constructor(status: number, message: string, details?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details;
    }
}

export function asList<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === 'object' && Array.isArray((value as { results?: unknown }).results)) return (value as { results: T[] }).results;
    return [];
}

function normalizeRole(role: unknown): string | undefined {
    return role === 'admin' ? 'administrator' : typeof role === 'string' ? role : undefined;
}

function normalizeStore(value: Record<string, unknown>): Store {
    return {
        id: Number(value.id),
        name: String(value.name ?? ''),
        address: typeof value.address === 'string' ? value.address : typeof value.location === 'string' ? value.location : undefined,
        role: normalizeRole(value.role),
    };
}

function normalizeProduct(value: Record<string, unknown>): Product {
    return {
        ...value,
        id: Number(value.id),
        store_id: Number(value.store_id ?? value.store),
        stock_quantity: Number(value.stock_quantity ?? 0),
        low_stock_threshold: 5,
    } as Product;
}

function normalizeMembership(value: Record<string, unknown>): Membership {
    return {
        ...value,
        id: Number(value.id),
        user_id: value.user_id === undefined ? Number(value.user) : Number(value.user_id),
        username: typeof value.username === 'string' ? value.username : undefined,
        role: normalizeRole(value.role) || 'staff',
        store_id: value.store_id === undefined ? Number(value.store) : Number(value.store_id),
    } as Membership;
}

function productPayload(input: Partial<Product>): Record<string, unknown> {
    const payload = { ...input };
    delete payload.id;
    delete payload.store_id;
    delete payload.low_stock_threshold;
    return payload;
}

function normalizeAuth(value: unknown): AuthMe {
    const data = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    const rawUser = data.user && typeof data.user === 'object' ? data.user as Record<string, unknown> : data;
    const rawStores = asList<Record<string, unknown>>(data.stores);
    return {
        user: {
            id: Number(rawUser.id),
            username: String(rawUser.username ?? ''),
            email: typeof rawUser.email === 'string' ? rawUser.email : undefined,
            first_name: typeof rawUser.first_name === 'string' ? rawUser.first_name : undefined,
            last_name: typeof rawUser.last_name === 'string' ? rawUser.last_name : undefined,
            is_staff: typeof rawUser.is_staff === 'boolean' ? rawUser.is_staff : undefined,
        },
        stores: rawStores.map(normalizeStore),
    };
}

function getCookie(name: string): string | null {
    const prefix = `${name}=`;
    const cookie = document.cookie.split('; ').find((item) => item.startsWith(prefix));
    return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

async function csrf(): Promise<{ csrfToken: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/csrf/`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new ApiError(response.status, 'Could not obtain a CSRF token.');
    const data = await response.json() as { csrfToken?: string };
    csrfToken = getCookie('csrftoken') || data.csrfToken || null;
    if (!csrfToken) throw new ApiError(response.status, 'The backend did not provide a CSRF token.');
    return { csrfToken };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const method = (init.method || 'GET').toUpperCase();
    const isMutating = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
    let hasRetriedCsrf = false;
    let requestAgain = true;
    let attempts = 0;
    let response: Response;

    do {
        requestAgain = false;
        attempts += 1;
        const headers = new Headers(init.headers);
        headers.set('Accept', 'application/json');
        if (isMutating) {
            if (!csrfToken) await csrf();
            headers.set('X-CSRFToken', csrfToken || '');
            headers.set('Content-Type', 'application/json');
        }
        response = await fetch(`${API_BASE_URL}${path}`, {
            ...init,
            credentials: 'include',
            headers,
        });

        if (
            response.status === 403 &&
            isMutating &&
            !hasRetriedCsrf &&
            (await response.clone().text()).toLowerCase().includes('csrf')
        ) {
            csrfToken = null;
            hasRetriedCsrf = true;
            requestAgain = true;
        }
    } while (requestAgain && attempts < 2);

    if (response.status === 204) return undefined as T;
    const raw = await response.text();
    let data: unknown = null;
    if (raw) {
        try {
            data = JSON.parse(raw);
        } catch {
            data = raw;
        }
    }
    if (!response.ok) {
        const detail = data && typeof data === 'object' && 'detail' in data
            ? String((data as { detail: unknown }).detail)
            : typeof data === 'string' && data ? data : `Request failed (${response.status}).`;
        throw new ApiError(response.status, detail, data);
    }
    return data as T;
}

export const api = {
    csrf,
    me: async () => normalizeAuth(await request<unknown>('/auth/me/')),
    login: async (username: string, password: string) => {
        await request('/auth/login/', { method: 'POST', body: JSON.stringify({ username, password }) });
        return api.me();
    },
    logout: () => request('/auth/logout/', { method: 'POST' }),
    stores: async () => asList<Record<string, unknown>>(await request<unknown>('/stores/')).map(normalizeStore),
    products: async (storeId: number) =>
        asList<Record<string, unknown>>(await request<unknown>(`/stores/${storeId}/products/`)).map(normalizeProduct),
    product: async (storeId: number, productId: number) => normalizeProduct(
        await request<Record<string, unknown>>(`/stores/${storeId}/products/${productId}/`),
    ),
    createProduct: async (storeId: number, input: Omit<Product, 'id' | 'store_id'>) => normalizeProduct(
        await request<Record<string, unknown>>(`/stores/${storeId}/products/`, {
            method: 'POST',
            body: JSON.stringify(productPayload(input)),
        }),
    ),
    updateProduct: async (storeId: number, productId: number, input: Partial<Product>) => normalizeProduct(
        await request<Record<string, unknown>>(`/stores/${storeId}/products/${productId}/`, {
            method: 'PATCH',
            body: JSON.stringify(productPayload(input)),
        }),
    ),
    deleteProduct: (storeId: number, productId: number) =>
        request<void>(`/stores/${storeId}/products/${productId}/`, { method: 'DELETE' }),
    users: async (storeId: number) =>
        asList<Record<string, unknown>>(await request<unknown>(`/stores/${storeId}/users/`)).map(normalizeMembership),
    addUser: async (storeId: number, input: { username: string; password?: string; role: string }) => normalizeMembership(
        await request<Record<string, unknown>>(`/stores/${storeId}/users/`, {
            method: 'POST',
            body: JSON.stringify({ ...input, role: input.role === 'administrator' ? 'admin' : input.role }),
        }),
    ),
    updateUser: async (storeId: number, membershipId: number, input: { role?: string }) => normalizeMembership(
        await request<Record<string, unknown>>(`/stores/${storeId}/users/${membershipId}/`, {
            method: 'PATCH',
            body: JSON.stringify({ role: input.role === 'administrator' ? 'admin' : input.role }),
        }),
    ),
    removeUser: (storeId: number, membershipId: number) =>
        request<void>(`/stores/${storeId}/users/${membershipId}/`, { method: 'DELETE' }),
    assistant: (storeId: number, message: string) =>
        request<AssistantResponse>('/assistant/chat/', {
            method: 'POST',
            body: JSON.stringify({ store_id: storeId, message }),
        }),
};

export const API_URL = API_BASE_URL;
