import { useState } from "react";
import { KeyRound } from "lucide-react";
import { changePassword } from "../../lib/auth";
import {
  cardClass,
  sectionTitleClass,
  labelClass,
  inputClass,
  primaryButtonClass,
} from "./fieldStyles";

const EMPTY_FORM = { currentPassword: "", newPassword: "", confirmPassword: "" };

export default function PasswordManager() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
    setDone(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.newPassword !== form.confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await changePassword(form.currentPassword, form.newPassword);
      setForm(EMPTY_FORM);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={cardClass}>
      <h2 className={sectionTitleClass}>Change Admin Password</h2>

      <p className="-mt-4 mb-6 font-inter text-sm text-gray-500">
        This signs you out of every other device and browser session.
      </p>

      <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
        <div>
          <label className={labelClass} htmlFor="current-password">
            Current Password
          </label>
          <input
            id="current-password"
            type="password"
            className={inputClass}
            required
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={(event) => update("currentPassword", event.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="new-password">
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            className={inputClass}
            required
            minLength={8}
            autoComplete="new-password"
            value={form.newPassword}
            onChange={(event) => update("newPassword", event.target.value)}
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="confirm-password">
            Confirm New Password
          </label>
          <input
            id="confirm-password"
            type="password"
            className={inputClass}
            required
            minLength={8}
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(event) => update("confirmPassword", event.target.value)}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 font-inter text-sm text-red-600">
            {error}
          </p>
        )}

        {done && (
          <p className="rounded-lg bg-green-50 px-3 py-2 font-inter text-sm text-green-700">
            Password updated. Use your new password the next time you sign in.
          </p>
        )}

        <button type="submit" disabled={busy} className={primaryButtonClass}>
          <span className="inline-flex items-center gap-2">
            <KeyRound size={16} />
            {busy ? "Updating..." : "Update Password"}
          </span>
        </button>
      </form>
    </section>
  );
}
