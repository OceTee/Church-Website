import { useEffect, useState } from "react";
import { Cake, X } from "lucide-react";
import Confetti from "./Confetti";
import SpeakerAvatar from "./SpeakerAvatar";
import { fetchBirthdaysForMonth, todaysBirthdays } from "../lib/birthdays";
import { todayIso } from "../lib/dates";
import { assetUrl } from "../lib/api";

// Remembers that the visitor closed today's celebration, so it does not
// reappear on every visit to the home page that day.
const DISMISSED_KEY = "cac_birthday_dismissed";

function dismissedToday(today) {
  try {
    return localStorage.getItem(DISMISSED_KEY) === today;
  } catch {
    return false;
  }
}

function rememberDismissed(today) {
  try {
    localStorage.setItem(DISMISSED_KEY, today);
  } catch {
    /* storage unavailable: it simply shows again next visit */
  }
}

/**
 * The celebrant's photo, uncropped at its own aspect ratio, framed with
 * rounded corners and a gold ring. Its height is capped on the golden ratio
 * scale (and by the screen height on a phone); the width follows the photo.
 * If the photo cannot load, the initials circle is shown instead.
 */
function CelebrantPhoto({ name, src, single }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <SpeakerAvatar
        name={name}
        className="h-[6.854rem] w-[6.854rem] rounded-full shadow-lg ring-4 ring-[#ffd700] ring-offset-2"
        initialsClassName="text-gr-lg"
      />
    );
  }

  return (
    <img
      src={assetUrl(src)}
      alt={`Photo of ${name}`}
      onError={() => setFailed(true)}
      className={`block h-auto w-auto max-w-full rounded-2xl object-contain shadow-lg ring-4 ring-[#ffd700] ring-offset-2 ${
        single ? "max-h-[min(17.944rem,38dvh)]" : "max-h-[min(11.09rem,30dvh)]"
      }`}
    />
  );
}

/**
 * On a member's birthday the home page throws confetti and slides up a card
 * from the bottom of the screen with the celebrant's photo, their name beneath
 * it, and the church's wishes. It loads the current month's birthdays and
 * shows those dated today. Sizes follow the golden ratio scale: the photo is
 * up to φ⁶ (17.944rem) tall for a single celebrant and φ⁵ (11.09rem) when
 * several share the day, with 1.618rem spacing.
 */
export default function BirthdayCelebration() {
  const [celebrants, setCelebrants] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const today = todayIso();
    if (dismissedToday(today)) return undefined;

    fetchBirthdaysForMonth(today.slice(0, 7))
      .then((birthdays) => {
        if (!active || !Array.isArray(birthdays)) return;
        const todays = todaysBirthdays(birthdays, today);
        setCelebrants(todays);
        setOpen(todays.length > 0);
      })
      .catch((error) => console.error("Failed to load birthdays:", error));

    return () => {
      active = false;
    };
  }, []);

  const close = () => {
    rememberDismissed(todayIso());
    setOpen(false);
  };

  const single = celebrants.length === 1;

  return (
    <>
      {open && <Confetti />}
      {open && (
        <div
            role="dialog"
            aria-modal="false"
            aria-labelledby="birthday-heading"
            className="birthday-panel fixed inset-x-0 bottom-0 z-[55] flex justify-center px-4 pb-4"
          >
            <div className="relative max-h-[85dvh] w-full max-w-[38.2rem] overflow-y-auto rounded-[1.618rem] border-t-4 border-[#ffd700] bg-white p-[1.618rem] text-center shadow-2xl md:p-[2.618rem]">
              <button
                type="button"
                onClick={close}
                aria-label="Close birthday celebration"
                className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>

              <p className="flex items-center justify-center gap-2 font-nunito text-xs font-semibold uppercase tracking-[0.162em] text-[#9550a7]">
                <Cake size={16} /> Celebrating today
              </p>
              <h2
                id="birthday-heading"
                className="mt-[0.618rem] font-palatino text-gr-lg font-bold text-[#330040] md:text-gr-xl"
              >
                Happy Birthday!
              </h2>

              <ul className="mt-[1.618rem] flex flex-wrap justify-center gap-[1.618rem]">
                {celebrants.map((celebrant, index) => (
                  <li
                    key={celebrant.id}
                    style={{ "--birthday-index": index }}
                    className={`birthday-item flex flex-col items-center gap-[0.618rem] ${single ? "w-full" : "max-w-[17.944rem] grow basis-[11.09rem]"}`}
                  >
                    <CelebrantPhoto name={celebrant.name} src={celebrant.photoUrl} single={single} />
                    <p className="font-palatino text-gr-md font-bold text-[#330040]">{celebrant.name}</p>
                    <p className="whitespace-pre-line font-nunito text-sm leading-[1.618] text-gray-600 md:text-base">
                      {celebrant.wishes}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
        </div>
      )}
    </>
  );
}
