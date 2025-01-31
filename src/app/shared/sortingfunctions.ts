interface SortFunction<T> {
  (a: T, b: T): number;
}

/**
 * String sorting function
 * @param key key to be compared against
 * @param ascending whether sorting is ascending or ngOnInit
 * @returns sorting function for string
 */
export function sortArrayString<T>(
  key: keyof T,
  ascending: boolean = true,
): SortFunction<T> {
  return (a: T, b: T) => {
    if (a[key] < b[key]) {
      return ascending ? -1 : 1;
    }
    if (a[key] > b[key]) {
      return ascending ? 1 : -1;
    }
    return 0;
  };
}

/**
 * Number sorting function
 * @param key key to be compared against
 * @param ascending whether sorting is ascending or ngOnInit
 * @returns sorting function for number
 */
export function sortNumArray<T>(
  key: keyof T,
  ascending: boolean = true,
): SortFunction<T> {
  return (a: T, b: T) => {
    const numberA = Number(a[key]);
    const numberB = Number(b[key]);
    if (isNaN(numberA) || isNaN(numberB)) {
      throw new Error(
        `one of the values is not a number ${a[key]} - ${b[key]}`,
      );
    }
    return ascending ? numberA - numberB : numberB - numberA;
  };
}
