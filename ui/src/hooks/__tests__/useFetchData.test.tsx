import { renderHook, waitFor, act } from '@testing-library/react';
import useFetchData from '../useFetchData';
import { GenericError } from '../../api/api-client';

describe('useFetchData', () => {
  it('starts with loading true and data/error null', async () => {
    const mockFetch = jest.fn(() => Promise.resolve({ value: 'test' }));
    const { result } = renderHook(() => useFetchData(mockFetch));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('sets data and loading false on successful fetch', async () => {
    const mockData = { id: 1, name: 'Test Data' };
    const mockFetch = jest.fn(() => Promise.resolve(mockData));
    const { result } = renderHook(() => useFetchData(mockFetch));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('sets error and loading false when fetch throws Error', async () => {
    const errorMessage = 'Network error';
    const mockError = new Error(errorMessage);
    const mockFetch = jest.fn(() => Promise.reject(mockError));
    const { result } = renderHook(() => useFetchData(mockFetch));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(mockError);
    expect(result.current.error?.message).toBe(errorMessage);
  });

  it('sets error and loading false when fetch throws GenericError', async () => {
    const mockError = new GenericError(500, 'Server error');
    const mockFetch = jest.fn(() => Promise.reject(mockError));
    const { result } = renderHook(() => useFetchData(mockFetch));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(mockError);
    expect((result.current.error as GenericError).description).toBe('Server error');
    expect((result.current.error as GenericError).httpCode).toBe(500);
  });

  it('refetches data when reload is called', async () => {
    const mockData1 = { value: 'first' };
    const mockData2 = { value: 'second' };
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce(mockData1)
      .mockResolvedValueOnce(mockData2);

    const { result } = renderHook(() => useFetchData(mockFetch));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockData1);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Call reload
    act(() => {
      result.current.reload();
    });

    await waitFor(() => expect(result.current.data).toEqual(mockData2));
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('maintains data as null when error occurs', async () => {
    const mockError = new Error('Failed to fetch');
    const mockFetch = jest.fn(() => Promise.reject(mockError));
    const { result } = renderHook(() => useFetchData(mockFetch));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(mockError);
  });

  it('resets loading to true during refetch', async () => {
    const mockData = { value: 'test' };
    const mockFetch = jest.fn(() => Promise.resolve(mockData));
    const { result } = renderHook(() => useFetchData(mockFetch));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Refetch
    act(() => {
      result.current.reload();
    });

    // Wait for the second fetch to complete
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
  });
});
