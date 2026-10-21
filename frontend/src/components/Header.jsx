export default function Header({ main, sub }) {
    return (
        <div className="flex flex-col gap-2 w-full">
            <h1 className="text-3xl md:text-4xl font-palatino font-bold text-[#330040]">
                {main}
            </h1>
            {sub && (
                <p className="text-base md:text-lg font-nunito text-gray-600 max-w-3xl leading-relaxed">
                    {sub}
                </p>
            )}
        </div>
    );
}
