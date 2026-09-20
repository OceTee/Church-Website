import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Trash2 } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function Dashboard() {
    const [photos, setPhotos] = useState([]);
    const [events, setEvents] = useState([]);
    const [sermons, setSermons] = useState([]);
    
    // Form states
    const [photoFile, setPhotoFile] = useState(null);
    const [photoDate, setPhotoDate] = useState('');
    
    const [eventTitle, setEventTitle] = useState('');
    const [eventDesc, setEventDesc] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [eventFlyer, setEventFlyer] = useState(null);

    const [sermonTitle, setSermonTitle] = useState('');
    const [sermonDate, setSermonDate] = useState('');
    const [sermonFile, setSermonFile] = useState(null);

    useEffect(() => {
        fetchPhotos();
        fetchEvents();
        fetchSermons();
    }, []);

    const fetchSermons = async () => {
        try {
            const res = await fetch(`${API_URL}/sermons`);
            const data = await res.json();
            setSermons(data);
        } catch (error) {
            console.error('Error fetching sermons:', error);
        }
    };

    const fetchPhotos = async () => {
        try {
            const res = await fetch(`${API_URL}/gallery`);
            const data = await res.json();
            setPhotos(data);
        } catch (error) {
            console.error('Error fetching photos:', error);
        }
    };

    const fetchEvents = async () => {
        try {
            const res = await fetch(`${API_URL}/events`);
            const data = await res.json();
            setEvents(data);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const handleSermonUpload = async (e) => {
        e.preventDefault();
        if (!sermonFile) return;

        const formData = new FormData();
        formData.append('audio', sermonFile);
        formData.append('title', sermonTitle);
        formData.append('date', sermonDate);

        try {
            await fetch(`${API_URL}/sermons`, {
                method: 'POST',
                body: formData,
            });
            setSermonTitle('');
            setSermonDate('');
            setSermonFile(null);
            fetchSermons();
        } catch (error) {
            console.error('Error uploading sermon:', error);
        }
    };

    const deleteSermon = async (id) => {
        try {
            await fetch(`${API_URL}/sermons/${id}`, { method: 'DELETE' });
            fetchSermons();
        } catch (error) {
            console.error('Error deleting sermon:', error);
        }
    };

    const handlePhotoUpload = async (e) => {
        e.preventDefault();
        if (!photoFile) return;

        const formData = new FormData();
        formData.append('image', photoFile);
        formData.append('date', photoDate);

        try {
            await fetch(`${API_URL}/gallery`, {
                method: 'POST',
                body: formData,
            });
            setPhotoFile(null);
            setPhotoDate('');
            fetchPhotos();
        } catch (error) {
            console.error('Error uploading photo:', error);
        }
    };

    const deletePhoto = async (id) => {
        try {
            await fetch(`${API_URL}/gallery/${id}`, { method: 'DELETE' });
            fetchPhotos();
        } catch (error) {
            console.error('Error deleting photo:', error);
        }
    };

    const handleEventCreate = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('title', eventTitle);
        formData.append('description', eventDesc);
        formData.append('date', eventDate);
        formData.append('time', eventTime);
        if (eventFlyer) formData.append('flyer', eventFlyer);

        try {
            await fetch(`${API_URL}/events`, {
                method: 'POST',
                body: formData,
            });
            setEventTitle('');
            setEventDesc('');
            setEventDate('');
            setEventTime('');
            setEventFlyer(null);
            fetchEvents();
        } catch (error) {
            console.error('Error creating event:', error);
        }
    };

    const deleteEvent = async (id) => {
        try {
            await fetch(`${API_URL}/events/${id}`, { method: 'DELETE' });
            fetchEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    return (
        <div className="flex flex-col min-h-dvh pt-32 items-center bg-gray-50 pb-20">
            <div className="w-[90%] md:w-[75%] flex flex-col gap-10">
                <Header main="Admin Dashboard" sub="Manage your website content here." />

                {/* Event Planner Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-3xl font-playfair mb-6 text-[#330040]">Event Planner</h2>
                    
                    <form onSubmit={handleEventCreate} className="flex flex-col gap-4 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input 
                                type="text" 
                                placeholder="Event Title" 
                                required
                                value={eventTitle}
                                onChange={(e) => setEventTitle(e.target.value)}
                                className="border p-2 rounded focus:outline-none focus:border-[#9550a7]"
                            />
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Date (e.g. 31st Oct)" 
                                    required
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    className="border p-2 rounded w-1/2 focus:outline-none focus:border-[#9550a7]"
                                />
                                <input 
                                    type="text" 
                                    placeholder="Time (e.g. 3:00PM)" 
                                    required
                                    value={eventTime}
                                    onChange={(e) => setEventTime(e.target.value)}
                                    className="border p-2 rounded w-1/2 focus:outline-none focus:border-[#9550a7]"
                                />
                            </div>
                        </div>
                        <textarea 
                            placeholder="Event Description (optional)" 
                            value={eventDesc}
                            onChange={(e) => setEventDesc(e.target.value)}
                            className="border p-2 rounded h-24 focus:outline-none focus:border-[#9550a7]"
                        />
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <label className="text-sm text-gray-600">Flyer (Optional):</label>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => setEventFlyer(e.target.files[0])}
                                className="text-sm"
                            />
                            <button type="submit" className="bg-[#9550a7] text-white px-6 py-2 rounded-lg ml-auto hover:bg-[#65007f] transition">
                                Add Event
                            </button>
                        </div>
                    </form>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-gray-700 border-b pb-2">Current Events</h3>
                        {events.length === 0 && <p className="text-gray-400 italic">No upcoming events.</p>}
                        {events.map(event => (
                            <div key={event.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                                <div>
                                    <h4 className="font-bold text-[#330040]">{event.title}</h4>
                                    <p className="text-sm text-gray-500">{event.date} at {event.time}</p>
                                </div>
                                <button onClick={() => deleteEvent(event.id)} className="text-red-500 hover:text-red-700">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Gallery Manager Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-3xl font-playfair mb-6 text-[#330040]">Gallery Manager</h2>
                    
                    <form onSubmit={handlePhotoUpload} className="flex flex-col md:flex-row items-center gap-4 mb-8">
                        <input 
                            type="file" 
                            accept="image/*"
                            required
                            onChange={(e) => setPhotoFile(e.target.files[0])}
                            className="text-sm"
                        />
                        <input 
                            type="text" 
                            placeholder="Date/Context (e.g. June 2026)" 
                            required
                            value={photoDate}
                            onChange={(e) => setPhotoDate(e.target.value)}
                            className="border p-2 rounded focus:outline-none focus:border-[#9550a7] flex-1"
                        />
                        <button type="submit" className="bg-[#9550a7] text-white px-6 py-2 rounded-lg hover:bg-[#65007f] transition">
                            Upload Photo
                        </button>
                    </form>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-gray-700 border-b pb-2">Current Photos</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {photos.length === 0 && <p className="text-gray-400 italic col-span-full">No photos uploaded.</p>}
                            {photos.map(photo => (
                                <div key={photo.id} className="relative group rounded-lg overflow-hidden border">
                                    <img src={`http://localhost:5000${photo.imageUrl}`} alt={photo.date} className="w-full h-32 object-cover" />
                                    <div className="absolute inset-0 bg-black/50 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-white text-xs mb-2">{photo.date}</p>
                                        <button onClick={() => deletePhoto(photo.id)} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sermons Manager Section */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-playfair font-bold text-[#330040] mb-6">Sermons Manager</h2>
                    <form onSubmit={handleSermonUpload} className="flex flex-col md:flex-row gap-4 items-end mb-8">
                        <div className="flex-1">
                            <label className="block text-sm font-bold mb-2">Sermon Title</label>
                            <input type="text" required value={sermonTitle} onChange={e => setSermonTitle(e.target.value)} className="w-full border rounded-lg p-2" placeholder="e.g. The Power of Faith" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-bold mb-2">Date Preached</label>
                            <input type="date" required value={sermonDate} onChange={e => setSermonDate(e.target.value)} className="w-full border rounded-lg p-2" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-bold mb-2">Audio File (.mp3)</label>
                            <input type="file" accept="audio/*" required onChange={e => setSermonFile(e.target.files[0])} className="w-full" />
                        </div>
                        <button type="submit" className="bg-[#65007f] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#500066] h-[42px]">
                            Upload
                        </button>
                    </form>

                    <h3 className="font-bold text-lg mb-4">Uploaded Sermons</h3>
                    <div className="flex flex-col gap-4">
                        {sermons.length === 0 && <p className="text-gray-400 italic">No sermons uploaded.</p>}
                        {sermons.map(sermon => (
                            <div key={sermon.id} className="flex justify-between items-center p-4 border rounded-lg hover:shadow-sm transition">
                                <div>
                                    <h4 className="font-bold text-[#330040]">{sermon.title}</h4>
                                    <p className="text-sm text-gray-500">{sermon.date}</p>
                                    <audio controls className="mt-2 h-8 w-64">
                                        <source src={`http://localhost:5000${sermon.audioUrl}`} type="audio/mpeg" />
                                    </audio>
                                </div>
                                <button onClick={() => deleteSermon(sermon.id)} className="text-red-500 hover:text-red-700 font-bold p-2 border border-red-200 rounded-lg bg-red-50">
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
