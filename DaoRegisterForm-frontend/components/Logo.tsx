import React from 'react';

type LogoProps = {
  src?: string | null;
  alt?: string;
  size?: number | string;
  bg?: string;
  className?: string;
};

export default function Logo({ src, alt = 'Logo', size = 64, bg = '#fff', className = '' }: LogoProps) {
  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      className={className}
      style={{
        width: sizeValue,
        height: sizeValue,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        background: bg,
        borderRadius: 10,
        border: '1px solid rgba(15,20,30,0.04)',
        boxShadow: '0 4px 12px rgba(2,6,23,0.06)',
        overflow: 'hidden',
        aspectRatio: '1 / 1',
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        />
      ) : (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect width="24" height="24" rx="6" fill="#F3F4F6" />
          <path d="M6 12h12" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}
