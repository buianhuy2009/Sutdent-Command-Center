import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedCallback } from './useDebouncedCallback';

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays execution of callback until delayMs has elapsed', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 200));

    act(() => {
      result.current('test-arg');
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(199);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('test-arg');
  });

  it('resets timer when called multiple times rapidly', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 200));

    act(() => {
      result.current('call-1');
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current('call-2');
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Total pass time since call 1 is 200ms, but call 2 reset the timer
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('call-2');
  });

  it('uses the latest function reference when re-rendered', () => {
    const initialCallback = vi.fn();
    const updatedCallback = vi.fn();

    const { result, rerender } = renderHook(
      ({ fn }) => useDebouncedCallback(fn, 200),
      { initialProps: { fn: initialCallback } }
    );

    act(() => {
      result.current('hello');
    });

    // Re-render with updated callback function reference
    rerender({ fn: updatedCallback });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(initialCallback).not.toHaveBeenCalled();
    expect(updatedCallback).toHaveBeenCalledTimes(1);
    expect(updatedCallback).toHaveBeenCalledWith('hello');
  });

  it('passes multiple arguments to the debounced callback', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 150));

    act(() => {
      result.current('a', 42, { key: 'val' });
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('a', 42, { key: 'val' });
  });
});
