import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Centralized token accessor for merchant authentication
function getMerchantToken(): string | null {
  return localStorage.getItem('merchantToken') || 
         sessionStorage.getItem('merchantToken') ||
         document.cookie.split(';').find(c => c.trim().startsWith('merchantToken='))?.split('=')[1] ||
         null;
}

// Centralized token accessor for admin authentication
function getAdminToken(): string | null {
  return localStorage.getItem('adminToken') || 
         sessionStorage.getItem('adminToken') ||
         'sizu-admin-2025'; // Default admin token
}

// Get authenticated headers with JWT token
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  
  // Check for admin token first (for admin API calls)
  const adminToken = getAdminToken();
  if (adminToken && window.location.pathname.includes('/admin')) {
    headers["x-admin-token"] = adminToken;
  } else {
    // Use merchant token for merchant API calls
    const merchantToken = getMerchantToken();
    if (merchantToken) {
      headers["Authorization"] = `Bearer ${merchantToken}`;
    }
  }
  
  return headers;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers = getAuthHeaders();
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey, meta }) => {
    const headers = getAuthHeaders();

    // Add additional headers from meta
    if (meta?.headers) {
      Object.assign(headers, meta.headers);
    }

    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
