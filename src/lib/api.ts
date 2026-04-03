import toast from 'react-hot-toast';

/**
 * VitaLink API wrapper with standardized error handling.
 * Handles 401, 403, 404, 500 responses globally.
 */
export async function fetchAPI<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (res.status === 401) {
      toast.error('Session expired. Please login again.');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (res.status === 403) {
      toast.error('Access denied. You don\'t have permission.');
      throw new Error('Forbidden');
    }

    if (res.status === 404) {
      toast.error('The requested resource was not found.');
      throw new Error('Not Found');
    }

    if (res.status >= 500) {
      toast.error('Something went wrong. Please try again.');
      throw new Error('Server Error');
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.error || `Request failed (${res.status})`;
      toast.error(message);
      throw new Error(message);
    }

    return res.json();
  } catch (error: any) {
    if (error.message === 'Failed to fetch') {
      toast.error('Network error. Check your connection.');
    }
    throw error;
  }
}

/**
 * Fetch with FormData (no auto Content-Type header)
 */
export async function fetchFormAPI<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const res = await fetch(url, options);

    if (res.status === 401) {
      toast.error('Session expired. Please login again.');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.error || `Request failed (${res.status})`;
      toast.error(message);
      throw new Error(message);
    }

    return res.json();
  } catch (error: any) {
    if (error.message === 'Failed to fetch') {
      toast.error('Network error. Check your connection.');
    }
    throw error;
  }
}
