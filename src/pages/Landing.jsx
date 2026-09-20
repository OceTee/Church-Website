import { useState, useEffect } from "react";
import Hero from "../components/Hero";
import ServiceSchedule from "../components/ServiceSchedule";
import MiniSermon from "../components/MiniSermon";
import MiniCalendar from "../components/MiniCalendar";
import { Link } from "react-router-dom";
import { ArrowRightToLine } from "lucide-react";

const API_URL = 'http://localhost:5000/api';

export default function Landing() {
    const [events, setEvents] = useState([]);
    const [sermons, setSermons] = useState([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch(`${API_URL}/events`);
                const data = await res.json();
                setEvents(data);
            } catch (error) {
                console.error("Failed to fetch events:", error);
            }
        };
        const fetchSermons = async () => {
            try {
                const res = await fetch(`${API_URL}/sermons`);
                const data = await res.json();
                setSermons(data.slice(0, 3)); // Only show top 3 on landing page
            } catch (error) {
                console.error("Failed to fetch sermons:", error);
            }
        };
        fetchEvents();
        fetchSermons();
    }, []);

    return (
        <div className="flex flex-col items-center">
            <Hero />
            <div className="w-[90%] md:w-[75%] flex flex-col items-center">
                <ServiceSchedule />
            </div>
            <div className="w-[90%] md:w-[75%] mt-15">
                <div className="flex flex-col gap-5 mb-2">
                    
                    {/* Recent Sermons Section */}
                    <div className="flex flex-row justify-between items-center mt-10">
                        <h1 className="text-3xl md:text-4xl font-playfair font-bold text-[#330040]">Recent Sermons</h1>
                        <Link to="/sermons" className="text-sm md:text-md font-inter text-[#65007f] hover:scale-105 transition duration-150 flex flex-row gap-2 items-center">View all <ArrowRightToLine size={18} /></Link>
                    </div>
                    <div className="flex flex-col md:flex-row gap-5 justify-center mb-10 overflow-hidden">
                        {sermons.length === 0 ? (
                            <p className="text-gray-500 italic w-full py-5 text-center bg-gray-50 rounded-xl border">No recent sermons available.</p>
                        ) : (
                            sermons.map(sermon => (
                                <MiniSermon 
                                    key={sermon.id}
                                    type="Audio Message" 
                                    title={sermon.title} 
                                    date={sermon.date} 
                                    audioUrl={sermon.audioUrl}
                                />
                            ))
                        )}
                    </div>

                    {/* Upcoming Events Section */}
                    <div className="flex flex-row justify-between items-center mt-5">
                        <h1 className="text-3xl md:text-4xl font-playfair font-bold text-[#330040]">Upcoming Events</h1>
                        <Link to="/about" className="text-sm md:text-md font-inter text-[#65007f]">Full calendar</Link>
                    </div>
                    
                    <div className="flex flex-col gap-4 mb-20">
                        {events.length === 0 ? (
                            <p className="text-gray-500 italic text-center py-10">No upcoming events right now.</p>
                        ) : (
                            events.map(event => (
                                <MiniCalendar 
                                    key={event.id}
                                    title={event.title} 
                                    sub={event.description} 
                                    date={event.date} 
                                    time={event.time}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
