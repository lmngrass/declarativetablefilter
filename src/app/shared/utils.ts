import {
  SortTableaction,
  TableData,
  TableItem,
} from '../components/table/models/table.model';

export function ifValueIsUndefinedOrNullReturnEmptyString(value: any): string {
  return value === undefined || value === null ? '' : value;
}
/**
 * Filters and maps the table data based on the form inputs.
 * @param value The form data and table data.
 * @returns The filtered table data.
 */
export function filterForTableItem(
  formData: any,
  tableItem: TableItem,
): boolean {
  const mapOfValues = new Map(Object.entries(formData));
  const filterValueForName = String(
    ifValueIsUndefinedOrNullReturnEmptyString(mapOfValues.get('name')),
  ).toLowerCase();
  const filterValueForAge = String(
    ifValueIsUndefinedOrNullReturnEmptyString(mapOfValues.get('age')),
  ).toLowerCase();
  let nameComparison = true;
  let ageComparison = true;
  if (filterValueForName) {
    nameComparison = compareSourceIncludesTarget(
      tableItem.name,
      filterValueForName,
    );
  }
  if (filterValueForAge) {
    ageComparison = compareSourceIncludesTarget(
      String(tableItem.age),
      filterValueForAge,
    );
  }
  return nameComparison && ageComparison;
}
/**
 * Compares if the source string includes the target string, case insensitive.
 * @param source The source string.
 * @param target The target string.
 * @returns True if the source includes the target, false otherwise.
 */
function compareSourceIncludesTarget(source: string, target: string): boolean {
  return source.toLowerCase().includes(target.toLowerCase());
}
