import {
  HOUSING_TYPE_PRESETS,
  SEOUL_RENT_CHECK_DISTRICTS,
  type RentCheckHousingType,
} from '@signedprice/korea-rent/browser';
import { useRef, useState, type Dispatch, type FormEvent } from 'react';

import {
  areaDisplayValue,
  clearRentCheckErrorsForAction,
  focusFirstRentCheckError,
  validateRentCheckInput,
  type RentCheckAction,
  type RentCheckState,
  type RentCheckValidationErrors,
} from '../../lib/rent-check/client-state';
import styles from './rent-check.module.css';

const HOUSING_TYPES = [
  ['apartment', 'Apartment'],
  ['officetel', 'Officetel'],
  ['villa', 'Villa'],
  ['detached', 'Detached / multi-unit'],
  ['studio', 'Studio alias'],
] as const satisfies readonly (readonly [RentCheckHousingType, string])[];

type RentCheckFormProps = {
  readonly state: RentCheckState;
  readonly dispatch: Dispatch<RentCheckAction>;
  readonly onSubmit: () => void;
};

export function RentCheckForm({ state, dispatch, onSubmit }: RentCheckFormProps) {
  const input = state.draftInput;
  const [errors, setErrors] = useState<RentCheckValidationErrors>({});
  const areaInput = useRef<HTMLInputElement>(null);
  const depositInput = useRef<HTMLInputElement>(null);
  const monthlyRentInput = useRef<HTMLInputElement>(null);
  const edit = (action: RentCheckAction) => {
    setErrors((current) => clearRentCheckErrorsForAction(current, action));
    dispatch(action);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateRentCheckInput(input, state.areaDisplay);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstRentCheckError(nextErrors, {
        areaSqm: areaInput.current,
        depositWon: depositInput.current,
        monthlyRentWon: monthlyRentInput.current,
      });
      return;
    }
    onSubmit();
  };

  return (
    <form className={styles['rent-check-form']} noValidate onSubmit={submit}>
      <div className={styles['form-grid']}>
        <div className={styles['field']}>
          <label htmlFor="rent-area">Area</label>
          <select
            className={styles['primary-control']}
            id="rent-area"
            value={input.lawdCd}
            onChange={(event) => edit({
              type: 'EDIT', field: 'lawdCd', value: event.currentTarget.value,
            })}
          >
            {SEOUL_RENT_CHECK_DISTRICTS.map((district) => (
              <option key={district.lawdCd} value={district.lawdCd}>
                {district.nameEn} ({district.nameKo})
              </option>
            ))}
          </select>
        </div>

        <fieldset className={styles['housing-fieldset']} aria-describedby="housing-type-help">
          <legend>Housing type</legend>
          <div className={styles['housing-choices']}>
            {HOUSING_TYPES.map(([value, label]) => (
              <label className={styles['housing-choice']} key={value}>
                <input
                  type="radio"
                  name="housingType"
                  value={value}
                  checked={input.housingType === value}
                  onChange={(event) => edit({
                    type: 'EDIT', field: 'housingType', value: event.currentTarget.value,
                  })}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className={styles['field']}>
          <label htmlFor="rent-size">Size</label>
          <div className={styles['size-control']}>
            <input
              className={styles['primary-control']}
              id="rent-size"
              ref={areaInput}
              name="area"
              type="text"
              inputMode="decimal"
              pattern="(?:0\.[0-9]{1,2}|[1-9][0-9]*(?:\.[0-9]{1,2})?)"
              required
              aria-invalid={Boolean(errors.areaSqm)}
              aria-describedby={errors.areaSqm ? 'size-help rent-size-error' : 'size-help'}
              value={areaDisplayValue(state)}
              onChange={(event) => {
                edit({
                  type: 'EDIT_AREA',
                  value: event.currentTarget.value,
                  unit: input.areaUnit,
                });
              }}
            />
            <div className={styles['unit-toggle']} role="group" aria-label="Area unit">
              <button
                type="button"
                aria-pressed={input.areaUnit === 'sqm'}
                onClick={() => edit({ type: 'SET_AREA_UNIT', unit: 'sqm' })}
              >㎡</button>
              <button
                type="button"
                aria-pressed={input.areaUnit === 'pyeong'}
                onClick={() => edit({ type: 'SET_AREA_UNIT', unit: 'pyeong' })}
              >pyeong</button>
            </div>
          </div>
          <p id="size-help" className={styles['field-help']}>
            Square metres remain the comparison source of truth.
          </p>
          {errors.areaSqm ? <p id="rent-size-error" className={styles['field-error']}>{errors.areaSqm}</p> : null}
        </div>

        <div className={styles['field']}>
          <label htmlFor="rent-deposit">Deposit (KRW)</label>
          <input
            className={styles['primary-control']}
            id="rent-deposit"
            ref={depositInput}
            name="deposit"
            type="text"
            inputMode="numeric"
            pattern="(?:0|[1-9][0-9]*)"
            maxLength={11}
            required
            aria-invalid={Boolean(errors.depositWon)}
            aria-describedby={errors.depositWon ? 'rent-deposit-error' : undefined}
            value={input.depositWon}
            onChange={(event) => {
              edit({
                type: 'EDIT', field: 'depositWon', value: event.currentTarget.value,
              });
            }}
          />
          {errors.depositWon ? <p id="rent-deposit-error" className={styles['field-error']}>{errors.depositWon}</p> : null}
        </div>

        <div className={styles['field']}>
          <label htmlFor="rent-monthly">Monthly rent (KRW)</label>
          <input
            className={styles['primary-control']}
            id="rent-monthly"
            ref={monthlyRentInput}
            name="rent"
            type="text"
            inputMode="numeric"
            pattern="(?:0|[1-9][0-9]*)"
            maxLength={9}
            required
            aria-invalid={Boolean(errors.monthlyRentWon)}
            aria-describedby={errors.monthlyRentWon ? 'rent-monthly-error' : undefined}
            value={input.monthlyRentWon}
            onChange={(event) => {
              edit({
                type: 'EDIT', field: 'monthlyRentWon', value: event.currentTarget.value,
              });
            }}
          />
          {errors.monthlyRentWon ? <p id="rent-monthly-error" className={styles['field-error']}>{errors.monthlyRentWon}</p> : null}
        </div>

        <div className={styles['field']}>
          <span className={styles['action-label']}>Official evidence</span>
          <button
            className={`${styles['primary-control']} ${styles['submit-button']}`}
            type="submit"
            disabled={state.status === 'loading'}
          >
            {state.status === 'loading' ? 'Checking…' : 'Check this quote'}
          </button>
        </div>
      </div>

      <div className={styles['form-assist']}>
        <div>
          <p id="housing-type-help">
            Choose the category that best matches the home. Official source classifications
            may be broader than listing labels.
          </p>
          {input.housingType === 'studio' ? (
            <p className={styles['studio-warning']}>
              Official records classify many studio and multi-unit homes under the
              detached / multi-unit source category.
            </p>
          ) : null}
        </div>
        <div className={styles['preset-group']} aria-label="Size presets">
          <span>Common size references</span>
          <div>
            {HOUSING_TYPE_PRESETS[input.housingType].map((preset) => (
              <button
                type="button"
                key={preset}
                data-size-preset={preset}
                onClick={() => edit({
                  type: 'EDIT_AREA', value: String(preset), unit: 'sqm',
                })}
              >{preset} ㎡</button>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
}
