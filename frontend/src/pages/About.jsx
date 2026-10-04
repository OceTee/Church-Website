import Header from "../components/Header";

export default function About() {
  return (
    <div className="flex min-h-dvh flex-col items-center px-6 pt-32 pb-20">
      <div className="flex w-full max-w-4xl flex-col gap-10">
        <Header
          main="About Us"
          sub="Discover who we are, what we believe, and where we're going together as a church family."
        />

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-10">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#330040] md:text-3xl">
            Community support
          </h2>
          <p className="font-inter text-base leading-relaxed text-gray-600 md:text-lg">
            Community Support: To run youth clubs, food banks, music concerts, medical outreach,  academic exhibitions, conferences, Revival meetings and support groups for neighbors in need.
          </p>
        </section>

        <section className="rounded-2xl bg-[#65007f] p-6 text-white shadow-md sm:p-10">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#ffd700] md:text-3xl">
            Main Purpose
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-4 font-playfair text-xl font-semibold md:text-2xl">
                Spiritual Purpose
              </h3>
              <p className="font-inter text-base leading-relaxed text-gray-200">
                 To share Christian teachings, Healing and Miracle crusade and support people's faith growth in Christ Jesus.
              </p>
            </div>
            <div>
              <h3 className="mb-4 font-playfair text-xl font-semibold md:text-2xl">
                Helping the Poor and less privileged
              </h3>
              <p className="font-inter text-base leading-relaxed text-gray-200">
                  Medical outreach for community, sch scholarship, business and entrepreneurs empowerment. To provide food, shelter, and support  people who are struggling or homeless.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
