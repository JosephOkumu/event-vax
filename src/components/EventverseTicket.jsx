import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, MapPin, Ticket as TicketIcon, ShieldCheck } from 'lucide-react';

const EventverseTicket = forwardRef(({ ticket }, ref) => {
    if (!ticket) return null;

    // QR Code Data - Encodes essential verification info
    const qrData = JSON.stringify({
        contractAddress: ticket.contractAddress || "0x...", 
        tokenId: ticket.tokenId,
        ownerAddress: ticket.owner
    });

    return (
        <div
            ref={ref}
            className="flex bg-[#0f0f12] text-white overflow-hidden relative border border-gray-800 rounded-lg shadow-2xl"
            style={{ width: '800px', height: '320px', fontFamily: 'sans-serif' }}
        >
            {/* LEFT SECTION: MAIN EVENT DETAILS */}
            <div className="w-[70%] relative flex flex-col overflow-hidden">
                
                {/* 1. Background Image with Gradient Overlay */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src={ticket.image || ticket.eventImage} 
                        alt="Event" 
                        className="w-full h-full object-cover opacity-50 grayscale-[20%]" 
                    />
                    {/* Dark gradient to ensure text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f12] via-[#0f0f12]/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f12] via-transparent to-transparent" />
                </div>

                {/* 2. Content Layer */}
                <div className="relative z-10 p-8 flex flex-col justify-between h-full">
                    {/* Top Row: Type & ID */}
                    <div className="flex items-center gap-3">
                        <span className="bg-purple-600 text-[10px] font-black px-2.5 py-1 rounded-sm uppercase tracking-[0.2em]">
                            {ticket.ticketType || 'Regular'}
                        </span>
                        <span className="text-gray-400 font-mono text-xs tracking-widest">
                            #{ticket.tokenId?.padStart(4, '0')}
                        </span>
                    </div>

                    {/* Middle: Title */}
                    <div>
                        <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-2 drop-shadow-md">
                            {ticket.eventName}
                        </h1>
                        <div className="h-1 w-20 bg-purple-500 rounded-full" />
                    </div>

                    {/* Bottom Row: Metadata */}
                    <div className="flex gap-8">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-purple-500/20 rounded-md">
                                <Calendar size={16} className="text-purple-400" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Date & Time</p>
                                <p className="text-sm font-bold">{ticket.eventDate || ticket.date}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-purple-500/20 rounded-md">
                                <MapPin size={16} className="text-purple-400" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Location</p>
                                <p className="text-sm font-bold truncate w-48">{ticket.venue || ticket.location}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* THE PERFORATION (Dashed Line with Cutouts) */}
            <div className="relative w-0.5 h-full flex flex-col justify-between items-center z-20">
                {/* Top Cutout */}
                <div className="absolute -top-4 -left-3 w-6 h-6 bg-[#000000] rounded-full border border-gray-800" />
                
                {/* Dashed Line */}
                <div className="w-full h-full border-l-2 border-dashed border-gray-700/60" />
                
                {/* Bottom Cutout */}
                <div className="absolute -bottom-4 -left-3 w-6 h-6 bg-[#000000] rounded-full border border-gray-800" />
            </div>

            {/* RIGHT SECTION: THE STUB (QR CODE) */}
            <div className="w-[30%] bg-[#16161a] p-6 flex flex-col items-center justify-center text-center relative">
                {/* Branding Text */}
                <div className="absolute top-6 left-0 right-0 flex justify-center items-center gap-1 opacity-50">
                    <ShieldCheck size={10} className="text-purple-400" />
                    <span className="text-[8px] font-bold uppercase tracking-[0.3em]">Official Entry Pass</span>
                </div>

                {/* QR Code Container */}
                <div className="bg-white p-2.5 rounded-lg shadow-xl mb-4 transform hover:scale-105 transition-transform">
                    <QRCodeSVG
                        value={qrData}
                        size={135}
                        level="H"
                        includeMargin={false}
                    />
                </div>

                {/* Seat/ID Detail */}
                <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Seat Number</p>
                    <p className="text-lg font-black text-purple-400 font-mono italic">
                        {ticket.seatNumber || `REG-${ticket.tokenId}`}
                    </p>
                </div>

                {/* Footer Branding */}
                <div className="absolute bottom-6 left-0 right-0 px-4">
                    <div className="flex flex-col items-center gap-1">
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest leading-none">Powered By</p>
                        <p className="text-[11px] text-gray-400 font-black italic tracking-tighter">AVALANCHE C-CHAIN</p>
                    </div>
                </div>
            </div>
        </div>
    );
});

EventverseTicket.displayName = 'EventverseTicket';

export default EventverseTicket;