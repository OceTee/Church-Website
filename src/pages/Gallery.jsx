import { useState, useEffect } from "react";
import Header from "../components/Header";

const API_URL = 'http://localhost:5000/api';

export default function Gallery() {
    const [photos, setPhotos] = useState([]);

    useEffect(() => {
        const fetchPhotos = async () => {
            try {
                const res = await fetch(`${API_URL}/gallery`);
                const data = await res.json();
                setPhotos(data);
            } catch (error) {
                console.error("Failed to fetch gallery:", error);
            }
        };
        fetchPhotos();
    }, []);

    return(
        <div className="flex flex-col min-h-dvh pt-32 items-center">
            <div className="w-[90%] md:w-[75%] flex flex-col mb-20">
                <Header main={"Gallery"} sub={"Moments from our services, events, and life together as a church family."}/>
                
                {photos.length === 0 ? (
                    <div className="text-center text-gray-500 my-20">No photos added yet. Check back soon!</div>
                ) : (
                    <div className="w-full h-fit grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                        {photos.map(photo => (
                            <div key={photo.id} className="relative group overflow-hidden rounded-xl shadow-md aspect-square">
                                <img src={`http://localhost:5000${photo.imageUrl}`} alt={photo.date} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                    <span className="text-white text-sm font-inter">{photo.date}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
