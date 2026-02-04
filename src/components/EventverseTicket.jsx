import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, MapPin, Ticket as TicketIcon } from 'lucide-react';

const EventverseTicket = forwardRef(({ ticket }, ref) => {
    if (!ticket) return null;

    // QR Code Data
    const qrData = JSON.stringify({
        contractAddress: "0x...", // You might want to pass this as a prop if dynamic
        tokenId: ticket.tokenId,
        ownerAddress: ticket.owner
    });

    return (
        <div
            ref={ref}
            className="flex bg-[#0f0f12] text-white overflow-hidden relative"
            style={{ width: '800px', height: '320px' }}
        >
            {/* Background Gradient & Pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20" />

            {/* Left Side (Main Info) */}
            <div className="w-[70%] relative p-8 flex flex-col justify-between border-r-2 border-dashed border-gray-700/50">
                {/* Decorative Circle Top */}
                <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-[#000000] z-10" />

                {/* Content */}
                <div className="z-10 relative h-full flex flex-col justify-between">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-purple-400 font-bold tracking-widest text-sm mb-1 uppercase">Eventverse Ticket</h3>
                            <h1 className="text-3xl font-bold italic text-white leading-tight max-w-md">
                                {ticket.eventName}
                            </h1>
                        </div>
                        <div className="bg-purple-600/20 border border-purple-500/50 px-3 py-1 rounded text-purple-300 text-sm font-semibold uppercase tracking-wider">
                            {ticket.ticketType}
                        </div>
                    </div>

                    {/* Middle Info */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-3 text-gray-300">
                            <Calendar className="w-5 h-5 text-purple-400" />
                            <span className="text-lg">{ticket.eventDate} • {ticket.eventTime}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-gray-300">
                            <MapPin className="w-5 h-5 text-purple-400" />
                            <span className="text-lg truncate max-w-sm">{ticket.venue}</span>
                        </div>
                    </div>

                    {/* Footer / ID */}
                    <div className="flex items-center space-x-2 text-gray-500 text-sm font-mono">
                        <TicketIcon className="w-4 h-4" />
                        <span>ID: {ticket.tokenId}</span>
                        <span className="mx-2">•</span>
                        <span>Seat: {ticket.seatNumber}</span>
                    </div>
                </div>

                {/* Background Image Overlay */}
                {ticket.image && (
                    <div className="absolute inset-0 z-0 opacity-10 mix-blend-overlay">
                        <img src={ticket.image} alt="" className="w-full h-full object-cover grayscale" />
                    </div>
                )}

                {/* Decorative Circle Bottom */}
                <div className="absolute -bottom-4 -right-4 w-8 h-8 rounded-full bg-[#000000] z-10" />
            </div>

            {/* Right Side (Stub / QR) */}
            <div className="w-[30%] bg-[#1a1a20] relative p-6 flex flex-col items-center justify-center border-l-2 border-dashed border-gray-700/50">
                {/* Decorative Circle Top (Matching left side) */}
                <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-[#000000] z-10" />

                <div className="bg-white p-3 rounded-xl shadow-lg shadow-purple-900/20 mb-4">
                    <QRCodeSVG
                        value={qrData}
                        size={140}
                        level={"H"}
                        includeMargin={false}
                    />
                </div>

                <div className="text-center">
                    <p className="text-gray-400 text-xs mb-1">SCAN FOR ENTRY</p>
                    <p className="text-purple-400 font-mono text-sm font-bold tracking-wider">#{ticket.tokenId}</p>
                </div>

                <div className="absolute bottom-4 text-[10px] text-gray-600 font-mono">
                    Powered by Avalanche
                </div>

                {/* Decorative Circle Bottom */}
                <div className="absolute -bottom-4 -left-4 w-8 h-8 rounded-full bg-[#000000] z-10" />
            </div>
        </div>
    );
});

EventverseTicket.displayName = 'EventverseTicket';

export default EventverseTicket;
