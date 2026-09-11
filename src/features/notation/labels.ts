export type LabelMode = 'notes' | 'degrees' | 'both' | 'hidden';

export const LABEL_MODE_OPTIONS: Array<{ value: LabelMode; label: string }> = [
  { value: 'notes', label: 'Note names' },
  { value: 'degrees', label: 'Scale degrees' },
  { value: 'both', label: 'Both' },
  { value: 'hidden', label: 'Hidden' },
];
