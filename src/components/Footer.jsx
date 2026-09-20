import { Globe, Send, MessageCircle, Camera, Music2 } from 'lucide-react';
import { Link } from "react-router-dom";


export default function Footer() {
    return(
        <div className="bg-[#330040] p-6 md:p-10 flex justify-center font-inter text-gray-400">
            <div className="w-full md:w-[85%] lg:w-[75%]">
                <div className='grid grid-col-1 items-center divide-y divide-gray-400 divide-opacity-50'>
                    <div className="flex flex-wrap gap-4 md:gap-6 py-8 justify-center md:justify-start">
                        <h1 className='flex items-center flex-row gap-2'><Globe size={18}/>CAC Possibility</h1>
                        <h1 className='flex items-center flex-row gap-2'><Send size={18}/>CAC Possibility</h1>
                        <h1 className='flex items-center flex-row gap-2'><MessageCircle size={18}/>CAC Possibility</h1>
                        <h1 className='flex items-center flex-row gap-2'><Camera size={18}/>CAC Possibility</h1>
                        <h1 className='flex items-center flex-row gap-2'><Music2 size={18}/>CAC Possibility</h1>
                    </div>
                    <div className="flex flex-col md:flex-row font-inter w-full justify-between py-8 gap-8 md:gap-0 text-center md:text-left">
                        <div className='flex flex-col gap-3'>
                            <h1 className='font-bold text-white text-lg'>Explore</h1>
                            <ul className='flex flex-col gap-3'>
                                <li>Events Calendar</li>
                                <Link to="/sermons" className="hover:text-white transition duration-150">Sermons</Link>
                                <Link to="/gallery" className="hover:text-white transition duration-150">Gallery</Link>
                                <Link to="/stream" className="hover:text-white transition duration-150">Stream</Link>
                            </ul>
                        </div>
                        <div className='flex flex-col gap-3'>
                            <h1 className='font-bold text-white text-lg'>Connect</h1>
                            <ul className='flex flex-col gap-3'>
                                <Link to="/about" className="hover:text-white transition duration-150">About</Link>
                                <button className="hover:text-white transition duration-150 text-left md:text-left mx-auto md:mx-0">Give</button>
                                <li>Get Connected</li>
                            </ul>
                        </div>
                        <div className='flex flex-col gap-3 max-w-xs mx-auto md:mx-0'>
                            <h1 className='font-bold text-white text-lg'>Visit Us</h1>
                            <p className='leading-relaxed'>3 Fatokun Street, Oremeta, <br /> Aba Apanu, Ologuneru Road, Ibadan.</p>
                        </div>
                    </div>
                </div>
                <p className="text-center md:text-left text-gray-400 text-sm opacity-60 mt-4">
                    &copy; {new Date().getFullYear()} CAC Possibility Assembly Nation. All rights reserved.
                </p>
            </div>
        </div>
    );
}



{/* <Link to="/" className="hover:scale-105 transition duration-150 active:font-bold">Home</Link> 
    <Link to="/sermons" className="hover:scale-105 transition duration-150 active:font-bold">Sermons</Link>
    <Link to="/gallery" className="hover:scale-105 transition duration-150 active:font-bold">Gallery</Link>
    <Link to="/stream" className="hover:scale-105 transition duration-150 active:font-bold">Stream</Link>
    <Link to="/about" className="hover:text-white transition duration-150 active:font-bold">About</Link>
    <Link to="/give" className="hover:text-white transition duration-150 active:font-bold">Give</Link> */}