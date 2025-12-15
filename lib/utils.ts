import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines conditional Tailwind/utility class names into a single string.
 *
 * **Specification**:
 *
 * Requires:
 * - `inputs` is any number of `ClassValue` arguments accepted by `clsx`:
 *   - strings,
 *   - arrays of strings or other class values,
 *   - objects mapping class names to boolean flags,
 *   - or falsey values that should be ignored.
 *
 * Effects:
 * - Uses `clsx` to convert the inputs into a space-separated class string,
 *   filtering out falsey values according to `clsx` semantics.
 * - Uses `twMerge` to merge Tailwind CSS classes intelligently so that
 *   conflicting utilities are resolved in favor of the last occurrence.
 * - Returns the resulting merged class string.
 * - Does not mutate any of its arguments or global state.
 *
 * @param inputs - Class name fragments to combine.
 * @returns A single merged class name string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
