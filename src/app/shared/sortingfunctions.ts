/**
 * String sorting function
 * @param array array to be sort
 * @param key key to be compared against
 * @param ascending whether sorting is ascending or ngOnInit
 * @returns sorting function for string
 */
export function sortArray<T>(
  array: T[],
  key: keyof T,
  ascending: boolean = true,
): T[] {
  return array.sort((a, b) => {
    if (a[key] < b[key]) {
      return ascending ? -1 : 1;
    }
    if (a[key] > b[key]) {
      return ascending ? 1 : -1;
    }
    return 0;
  });
}

/**
 * String sorting function
 * @param array array to be sort
 * @param key key to be compared against
 * @param ascending whether sorting is ascending or ngOnInit
 * @returns sorting function for string
 */
export function sortNumArray<T>(
  array: T[],
  key: keyof T,
  ascending: boolean = true,
): T[] {
  return array.sort((a, b) => {
    const numberA = Number(a[key]);
    const numberB = Number(b[key]);
    if (isNaN(numberA) || isNaN(numberB)) {
      throw new Error(
        `one of the values is not a number ${a[key]} - ${b}[key]`,
      );
    }
    return ascending ? numberA - numberB : numberB - numberA;
  });
}
