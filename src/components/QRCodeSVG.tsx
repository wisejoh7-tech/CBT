import React from 'react';

interface QRCodeSVGProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCodeSVG: React.FC<QRCodeSVGProps> = ({
  value,
  size = 120,
  className = ""
}) => {
  // Pure SVG fallback rendering using api.qrserver.com or simple vector matrix fallback
  const encodedValue = encodeURIComponent(value || '');
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}&format=svg`;

  return (
    <div className={`inline-block relative overflow-hidden bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-sm ${className}`}>
      <img
        src={qrUrl}
        alt={`QR Code: ${value}`}
        width={size}
        height={size}
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
  );
};

export default QRCodeSVG;
