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
            Our Story
          </h2>
          <p className="font-inter text-base leading-relaxed text-gray-600 md:text-lg">
            [Placeholder text: Briefly describe the history of the church here.
            Talk about when it was founded, who founded it, and the journey so
            far. This is a great place to highlight your church's legacy and
            ongoing growth.]
          </p>
        </section>

        <section className="rounded-2xl bg-[#65007f] p-6 text-white shadow-md sm:p-10">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#ffd700] md:text-3xl">
            Our Mission & Vision
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-4 font-playfair text-xl font-semibold md:text-2xl">
                Mission
              </h3>
              <p className="font-inter text-base leading-relaxed text-gray-200">
                [Placeholder text: "To love God, love people, and make
                disciples." Describe the core mission of your church here.]
              </p>
            </div>
            <div>
              <h3 className="mb-4 font-playfair text-xl font-semibold md:text-2xl">
                Vision
              </h3>
              <p className="font-inter text-base leading-relaxed text-gray-200">
                [Placeholder text: "To be a beacon of hope and a center for
                community transformation." Describe the long-term vision here.]
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
