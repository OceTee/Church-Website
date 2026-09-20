import Header from "../components/Header";

export default function About() {
    return(
        <div className="flex flex-col min-h-dvh pt-32 items-center">
            <div className="w-[90%] md:w-[75%] flex flex-col gap-12 mb-20">
                <Header main="About Us" sub="Discover who we are, what we believe, and where we're going together as a church family."/>
                
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                    <h2 className="text-[var(--text-gr-xl)] font-playfair font-bold text-[#330040] mb-6">Our Story</h2>
                    <p className="text-[var(--text-gr-md)] text-gray-600 leading-relaxed font-inter">
                        [Placeholder text: Briefly describe the history of the church here. Talk about when it was founded, who founded it, and the journey so far. This is a great place to highlight your church's legacy and ongoing growth.]
                    </p>
                </section>

                <section className="bg-[#65007f] text-white rounded-2xl shadow-md p-8 md:p-12">
                    <h2 className="text-[var(--text-gr-xl)] font-playfair font-bold mb-6 text-[#ffd700]">Our Mission & Vision</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-[var(--text-gr-lg)] font-playfair font-semibold mb-4">Mission</h3>
                            <p className="text-[var(--text-gr-base)] text-gray-200 leading-relaxed font-inter">
                                [Placeholder text: "To love God, love people, and make disciples." Describe the core mission of your church here.]
                            </p>
                        </div>
                        <div>
                            <h3 className="text-[var(--text-gr-lg)] font-playfair font-semibold mb-4">Vision</h3>
                            <p className="text-[var(--text-gr-base)] text-gray-200 leading-relaxed font-inter">
                                [Placeholder text: "To be a beacon of hope and a center for community transformation." Describe the long-term vision here.]
                            </p>
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                    <h2 className="text-[var(--text-gr-xl)] font-playfair font-bold text-[#330040] mb-8">Leadership Team</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                        {/* Placeholder Team Member */}
                        <div className="flex flex-col items-center text-center">
                            <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 shadow-inner flex items-center justify-center text-gray-400">Photo</div>
                            <h4 className="text-[var(--text-gr-lg)] font-bold text-[#330040]">Pastor [Name]</h4>
                            <p className="text-[var(--text-gr-base)] text-[#65007f]">Lead Pastor</p>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 shadow-inner flex items-center justify-center text-gray-400">Photo</div>
                            <h4 className="text-[var(--text-gr-lg)] font-bold text-[#330040]">[Name]</h4>
                            <p className="text-[var(--text-gr-base)] text-[#65007f]">Associate Pastor</p>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 shadow-inner flex items-center justify-center text-gray-400">Photo</div>
                            <h4 className="text-[var(--text-gr-lg)] font-bold text-[#330040]">[Name]</h4>
                            <p className="text-[var(--text-gr-base)] text-[#65007f]">Worship Leader</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
