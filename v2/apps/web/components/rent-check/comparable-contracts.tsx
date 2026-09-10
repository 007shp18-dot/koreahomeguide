import type { SeoulRentCheckEnvelope } from '@signedprice/korea-rent/browser';

import styles from './rent-check.module.css';
import { TrustLabel } from './trust-label';

type ComparableContractsProps = {
  readonly envelope: SeoulRentCheckEnvelope;
};

function won(value: number): string {
  return `₩${value.toLocaleString('en-US')}`;
}

export function ComparableContracts({ envelope }: ComparableContractsProps) {
  if (envelope.status === 'insufficient' || envelope.result.comparableCount < 3) {
    return (
      <p className={styles['insufficient-rows']}>
        Comparable rows are withheld because the official sample is below 3 contracts.
      </p>
    );
  }

  const rows = [...envelope.comparables]
    .sort((left, right) => right.contractDate.localeCompare(left.contractDate))
    .slice(0, 10);

  return (
    <div className={styles['comparable-contracts']}>
      <div className={styles['comparables-intro']}>
        <TrustLabel>Official reported contracts</TrustLabel>
        <p>Newest compatible evidence rows. The full selected sample may be larger.</p>
      </div>
      <div
        className={styles['comparables-scroll']}
        role="region"
        aria-label="Comparable contracts, newest first"
        tabIndex={0}
      >
        <table>
          <caption>Compatible official reported rental contracts, newest first</caption>
          <thead>
            <tr>
              <th scope="col">Building</th>
              <th scope="col">Area</th>
              <th scope="col">Deposit</th>
              <th scope="col">Monthly rent</th>
              <th scope="col">Contract date</th>
              <th scope="col">Contract type</th>
              <th scope="col">Record status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.contractDate}-${row.buildingLabel ?? 'unlabelled'}-${index}`}>
                <th scope="row">{row.buildingLabel ?? 'Building not reported'}</th>
                <td>{row.areaSqm.toLocaleString('en-US')} ㎡</td>
                <td>{won(row.depositWon)}</td>
                <td>{won(row.monthlyRentWon)}</td>
                <td><time dateTime={row.contractDate}>{row.contractDate}</time></td>
                <td>{row.contractType}</td>
                <td>{row.recordStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
