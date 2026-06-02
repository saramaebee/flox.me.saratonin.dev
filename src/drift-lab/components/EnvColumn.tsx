import { FIELD_LABELS, FIELD_ORDER, type FieldKey } from "../data.ts";
import { type EnvStatus, type ResolvedEnv } from "../model.ts";

interface Props {
  env: ResolvedEnv;
  showCuda: boolean;
}

const STATUS_LABEL: Record<EnvStatus, string> = {
  passing: "passing",
  warning: "warning",
  failing: "failing",
};

const STATUS_MARK: Record<EnvStatus, string> = {
  passing: "✓",
  warning: "!",
  failing: "×",
};

const STATE_MARK = {
  aligned: "",
  drift: "~",
  missing: "×",
  pinned: "+",
} as const;

export function EnvColumn({ env, showCuda }: Props) {
  const fields = FIELD_ORDER.filter(
    (k): k is FieldKey => k !== "cuda" || showCuda,
  ).map((k) => env.fields.find((f) => f.key === k)!);

  return (
    <article className={`dl-col dl-${env.status}`}>
      <header className="dl-col-head" style={{ ["--col-accent" as string]: `var(${env.accent})` }}>
        <div className="dl-col-titles">
          <h3>{env.name}</h3>
          <p>{env.role}</p>
        </div>
        <span className={`dl-status dl-status-${env.status}`}>
          <span className="dl-status-mark" aria-hidden>
            {STATUS_MARK[env.status]}
          </span>
          {STATUS_LABEL[env.status]}
        </span>
      </header>

      <dl className="dl-fields">
        {fields.map((field) => (
          <div className={`dl-field dl-field-${field.state}`} key={field.key}>
            <dt>{FIELD_LABELS[field.key]}</dt>
            <dd>
              <span className="dl-value">{field.value}</span>
              <span className="dl-tags">
                {field.state !== "aligned" && (
                  <span className="dl-state-mark" aria-hidden>
                    {STATE_MARK[field.state]}
                  </span>
                )}
                <span className={`dl-badge ${field.implicit ? "implicit" : "pinned"}`}>
                  {field.implicit ? "implicit" : "pinned"}
                </span>
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
