import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import QRCodeSVG without SSR
const QRCodeSVG = dynamic(() => import('qrcode.react').then((mod) => mod.QRCodeSVG), { ssr: false });

export default function ShowQR({ otpauth_url }: { otpauth_url: string }) {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg border-4 border-white dark:border-gray-800">
    
      {otpauth_url && (
        <QRCodeSVG
          value={otpauth_url}
          size={200} // Increase size as per your requirement
          bgColor="#FFFFFF" // Background color of the QR code itself to ensure readability
          fgColor="#000000" // Foreground color (the QR code itself)
          includeMargin={true}
        />
      )}
    </div>
  );
}
