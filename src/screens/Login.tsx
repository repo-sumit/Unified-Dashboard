import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AppUser, Role } from "@/types";
import { dataProvider } from "@/data/provider";
import { useSession } from "@/store/session";
import { useT } from "@/i18n";
import { greetingKey } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/atoms";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { CheckCircle2, Info, ChevronRight } from "@/components/ui/Icon";
import meta from "@/data/seed/meta.json";

type Step = "form" | "verify";
const TP_ROLES: Role[] = ["teacher", "principal"];

/**
 * Dynamic login — one User ID input first. The number of digits decides the role
 * surface (no tabs): 8 digits → Teacher / Principal (asks 11-digit School ID); 2/4/6/10
 * digits → Officer (asks 4-digit PIN). The actual role is still resolved from the seed;
 * the digit length only chooses which second credential to ask for.
 */
const credType = (len: number): "tp" | "officer" | "none" =>
  len === 8 ? "tp" : len === 2 || len === 4 || len === 6 || len === 10 ? "officer" : "none";

export default function Login() {
  const { t, tn, lang } = useT();
  const login = useSession((s) => s.login);
  const navigate = useNavigate();

  const [id, setId] = useState("");
  const [second, setSecond] = useState("");
  const [idTouched, setIdTouched] = useState(false);
  const [secondTouched, setSecondTouched] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<AppUser | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  const greet = t(`greeting.${greetingKey()}`);

  const type = credType(id.length); // "tp" | "officer" | "none"
  const isTP = type === "tp";
  const isOfficer = type === "officer";
  const idLenValid = type !== "none";
  const secondValid = isTP ? /^\d{11}$/.test(second) : isOfficer ? /^\d{4}$/.test(second) : false;
  const canContinue = idLenValid && secondValid;

  const idError = idTouched && id.length > 0 && !idLenValid ? t("login.errIdLen") : null;
  const secondError = secondTouched && second.length > 0 && !secondValid ? (isTP ? t("login.errUdise11") : t("login.errPin4")) : null;

  const onIdChange = (v: string) => {
    const next = v.replace(/\D/g, "").slice(0, 10); // numeric only, longest user ID is 10
    if (credType(next.length) !== credType(id.length)) { setSecond(""); setSecondTouched(false); } // credential type changed → reset
    setId(next);
    setError(null);
  };

  const submitForm = () => {
    setError(null);
    setIdTouched(true);
    setSecondTouched(true);
    if (!canContinue) return;
    const user = dataProvider.resolveLoginById(id, second);
    // role from the seed must agree with the surface implied by the ID length
    if (!user || TP_ROLES.includes(user.role) !== isTP) { setError(t("login.invalid")); return; }
    setPending(user);
    setStep("verify");
  };

  const finish = () => { if (!pending) return; login(pending); navigate("/app", { replace: true }); };

  const pickDemo = (lid: string, sec: string) => {
    setId(lid.replace(/\D/g, "").slice(0, 10));
    setSecond(sec);
    setIdTouched(false);
    setSecondTouched(false);
    setError(null);
  };

  const scopeEntity = pending ? dataProvider.getEntity(pending.entity_id) : undefined;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-primary-50 to-surface-muted">
      <div className="flex items-center justify-between bg-primary-500 px-4 py-3 text-white">
        <div className="flex min-w-0 items-center gap-2">
          <img src="/logo-vsk.png" alt="" className="h-7 w-7 shrink-0 object-contain brightness-0 invert" />
          <span className="truncate font-extrabold tracking-tight">{t("app.name")}</span>
        </div>
        <LanguageToggle className="!bg-white/15" />
      </div>

      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-[420px] animate-scale-in">
          <div className="card card-pad sm:p-7">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary-50 ring-1 ring-primary-100">
              {step === "verify" ? (
                <CheckCircle2 className="text-primary-500" size={28} />
              ) : (
                <img src="/logo-vsk.png" alt="Vidya Samiksha Kendra" className="h-11 w-11 object-contain" />
              )}
            </div>

            {step === "form" && (
              <form className="animate-fade-in" onSubmit={(e) => { e.preventDefault(); submitForm(); }}>
                <h1 className="mt-4 text-center text-2xl font-extrabold leading-tight text-neutral-900">{t("login.welcome")}</h1>
                <p className="mt-1 text-center text-sm text-neutral-500">{t("login.subtitle")}</p>

                <div className="mt-6 space-y-4">
                  <Field
                    label={t("login.userId")}
                    value={id}
                    onChange={onIdChange}
                    onBlur={() => setIdTouched(true)}
                    placeholder={t("login.userIdPh")}
                    maxLength={10}
                    autoComplete="username"
                    error={idError}
                    autoFocus
                  />

                  {idLenValid && (
                    <span className="inline-flex w-fit items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wide text-primary-600">
                      {isTP ? t("login.modeTP") : t("login.officerLogin")}
                    </span>
                  )}

                  {idLenValid && (
                    <Field
                      key={type}
                      label={isTP ? t("login.schoolId") : t("login.passcode")}
                      value={second}
                      onChange={(v) => setSecond(v.replace(/\D/g, "").slice(0, isTP ? 11 : 4))}
                      onBlur={() => setSecondTouched(true)}
                      placeholder={isTP ? t("login.schoolIdPh") : t("login.pinPh")}
                      type={isTP ? "text" : "password"}
                      maxLength={isTP ? 11 : 4}
                      autoComplete={isTP ? "off" : "current-password"}
                      helper={isTP ? t("login.helpSchool") : t("login.helpPin")}
                      error={secondError}
                      className="animate-fade-in"
                      autoFocus
                    />
                  )}
                </div>

                {error && <p className="mt-4 rounded-lg bg-rag-redSoft px-3 py-2 text-xs font-medium text-rag-redText">{error}</p>}
                <Button full type="submit" className="mt-6" disabled={!canContinue}>{t("login.continue")}</Button>
              </form>
            )}

            {step === "verify" && pending && (
              <div className="animate-fade-in">
                <h1 className="mt-4 text-center text-2xl font-extrabold text-neutral-900">{greet}, {tn(pending.name, pending.name_gu).split(" ")[0]}!</h1>
                <p className="mt-1 text-center text-sm text-neutral-500">{t("login.verifySub")}</p>
                <dl className="mt-5 space-y-1 rounded-xl bg-neutral-50 p-4 text-sm">
                  <Row label={t("login.name")} value={tn(pending.name, pending.name_gu)} />
                  <Row label={t("login.userId")} value={pending.login_id} />
                  <Row label={t("login.designation")} value={lang === "gu" ? t(`roles.${pending.role}`) : pending.designation} />
                  <Row label={t("login.Grade")} value={scopeEntity ? tn(scopeEntity.name, scopeEntity.name_gu) : t("common.na")} />
                </dl>
                <div className="mt-5 space-y-2.5">
                  <Button full onClick={finish}>{t("login.signIn")}</Button>
                  <Button full variant="soft" onClick={() => { setStep("form"); setPending(null); }}>{t("login.goBack")}</Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-neutral-400">
            <Info size={13} /> {t("app.interim")}
          </div>

          {step === "form" && (
            <div className="mt-2 text-center">
              <button onClick={() => setShowDemo((v) => !v)} className="text-xs font-semibold text-primary-600 hover:underline">
                {t("login.demoHint")} {showDemo ? "▲" : "▼"}
              </button>
              {showDemo && <DemoTable onPick={pickDemo} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DemoTable({ onPick }: { onPick: (id: string, second: string) => void }) {
  const { t } = useT();
  const logins = useMemo(() => meta.demoLogins.filter((d, i, a) => a.findIndex((x) => x.role === d.role) === i), []);
  return (
    <div className="mt-2 animate-fade-in space-y-1 rounded-xl border border-line/70 bg-white p-3 text-left text-xs">
      {logins.map((d) => (
        <button
          key={d.role}
          onClick={() => onPick(d.login_id, (d.passcode ?? d.school_id) ?? "")}
          className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-50"
        >
          <span className="shrink-0 font-semibold text-neutral-700">{t(`roles.${d.role}`)}</span>
          <span className="min-w-0 truncate text-neutral-500">
            {d.login_id} · {d.passcode ? `${t("login.passcode")} ${d.passcode}` : `${t("login.schoolId")} ${d.school_id}`}
          </span>
          <ChevronRight size={13} className="shrink-0 text-neutral-300" />
        </button>
      ))}
    </div>
  );
}

function Field({
  label, value, onChange, onBlur, placeholder, type = "text", autoFocus, maxLength, autoComplete, helper, error, className,
}: {
  label: string; value: string; onChange: (v: string) => void; onBlur?: () => void;
  placeholder?: string; type?: string; autoFocus?: boolean; maxLength?: number; autoComplete?: string;
  helper?: string; error?: string | null; className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-sm font-semibold text-neutral-700">{label}</span>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete={autoComplete}
        aria-invalid={!!error}
        className={cn(
          "w-full rounded-xl border bg-neutral-50 px-4 py-3 text-sm outline-none transition-colors focus:bg-white",
          error ? "border-rag-red focus:border-rag-red" : "border-line focus:border-primary-400",
        )}
      />
      {error ? (
        <span className="mt-1 block text-xs font-medium text-rag-redText">{error}</span>
      ) : helper ? (
        <span className="mt-1 block text-2xs text-neutral-400">{helper}</span>
      ) : null}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <dt className="shrink-0 text-neutral-500">{label}</dt>
      <dd className="min-w-0 truncate text-right font-semibold text-neutral-900">{value}</dd>
    </div>
  );
}
