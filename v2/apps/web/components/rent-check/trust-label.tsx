import styles from '../../app/kr/seoul/tools/rent-check/rent-check.module.css';

type TrustLabelProps = {
  readonly children: string;
};

export function TrustLabel({ children }: TrustLabelProps) {
  return <p className={styles['trust-label']}>{children}</p>;
}
