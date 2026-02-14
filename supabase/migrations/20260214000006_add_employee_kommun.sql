-- Add kommun (municipality) field to employees
-- Tax rate (kommunalskatt) is based on where the employee is folkbokförd (registered living),
-- not where they work. Each of Sweden's 290 kommuner has a different rate.

ALTER TABLE employees
ADD COLUMN IF NOT EXISTS kommun TEXT;

COMMENT ON COLUMN employees.kommun IS 'Folkbokföringskommun — determines kommunalskatt rate for payroll withholding';
