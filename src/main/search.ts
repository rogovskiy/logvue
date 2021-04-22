/* eslint-disable import/prefer-default-export */
import type { FilterT } from '../types';

export const createLineMatcher = (filter: FilterT): ((LineT) => boolean) => {
  try {
    const regex = new RegExp(filter.query, filter.matchCase ? '' : 'i');
    return (line) => line.line.match(regex) != null;
  } catch (e) {
    return () => false;
  }
};
