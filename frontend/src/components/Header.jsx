export default function Header({ main, sub }) {
    return (
        <div className="flex w-full flex-col gap-2.5">
            <h1 className="font-palatino text-[clamp(2rem,6vw,2.618rem)] font-bold leading-[1.08] tracking-[-0.025em] text-[#330040]">
                {main}
            </h1>
            <span aria-hidden="true" className="h-1 w-10 rounded-full bg-[#ffd700]" />
            {sub && (
                <p className="max-w-3xl font-nunito text-base leading-relaxed text-gray-600 sm:text-lg">
                    {sub}
                </p>
            )}
        </div>
    );
}
