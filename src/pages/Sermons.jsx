import { useState, useEffect } from "react";
import Header from "../components/Header";
import MiniSermon from "../components/MiniSermon";

const API_URL = 'http://localhost:5000/api';

export default function Sermons() {
    const [sermons, setSermons] = useState([]);

    useEffect(() => {
        const fetchSermons = async () => {
            try {
                const res = await fetch(`${API_URL}/sermons`);
                const data = await res.json();
                setSermons(data);
            } catch (error) {
                console.error("Failed to fetch sermons:", error);
            }
        };
        fetchSermons();
    }, []);

    return (
        <div className="flex flex-col min-h-dvh pt-32 items-center">
            <div className="w-[90%] md:w-[75%] flex flex-col gap-10 mb-20">
                <Header main="Sermons" sub="Listen and catch-up on past messages."/>
                
                {sermons.length === 0 ? (
                    <div className="text-center text-gray-500 italic py-20 bg-gray-50 rounded-2xl border border-gray-200">
                        No sermons have been uploaded yet. Check back later!
                    </div>
                ) : (
                    <div className="flex flex-wrap justify-center md:justify-start gap-6">
                        {sermons.map(sermon => (
                            <MiniSermon 
                                key={sermon.id}
                                type="Audio Message"
                                title={sermon.title}
                                date={sermon.date}
                                audioUrl={sermon.audioUrl}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
