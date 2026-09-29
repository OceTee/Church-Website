export default function MiniCalendar({ title, sub, date, time }) {
  return (
    <div className="mb-4 flex flex-col justify-between gap-4 rounded-xl border border-[#65007f]/30 bg-white p-5 shadow-sm md:flex-row md:items-center">
      <div className="min-w-0">
        <h2 className="font-playfair text-xl font-semibold text-[#330040] md:text-2xl">
          {title}
        </h2>
        {sub && (
          <p className="mt-1 font-inter text-sm text-gray-500 md:text-base">
            {sub}
          </p>
        )}
      </div>
      <div className="flex min-w-[110px] shrink-0 flex-col items-center rounded-lg bg-[#65007f] px-4 py-2 text-center font-inter text-sm text-white">
        <p className="font-bold">{date}</p>
        <p>{time}</p>
      </div>
    </div>
  );
}
