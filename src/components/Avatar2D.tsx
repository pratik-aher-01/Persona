import React from 'react';
import type { AvatarStatus, Emotion } from '../types/persona';

interface Avatar2DProps {
  status: AvatarStatus;
  emotion: Emotion;
}

export const Avatar2D: React.FC<Avatar2DProps> = ({ status, emotion }) => {
  const isSpeaking = status === 'speaking';

  // Theme & accent colors per emotion
  const emotionThemeMap: Record<
    Emotion,
    { bg: string; border: string; glow: string; label: string; badgeClass: string }
  > = {
    neutral: {
      bg: '#1f2430',
      border: '#3b4252',
      glow: 'rgba(94, 129, 172, 0.25)',
      label: 'NEUTRAL',
      badgeClass: 'badge-neutral',
    },
    warm: {
      bg: '#251e2b',
      border: '#b48ead',
      glow: 'rgba(180, 142, 173, 0.3)',
      label: 'WARM',
      badgeClass: 'badge-warm',
    },
    skeptical: {
      bg: '#2b261e',
      border: '#ebcb8b',
      glow: 'rgba(235, 203, 139, 0.3)',
      label: 'SKEPTICAL',
      badgeClass: 'badge-skeptical',
    },
    impressed: {
      bg: '#1e2b27',
      border: '#a3be8c',
      glow: 'rgba(163, 190, 140, 0.35)',
      label: 'IMPRESSED',
      badgeClass: 'badge-impressed',
    },
    stern: {
      bg: '#2d1d24',
      border: '#bf616a',
      glow: 'rgba(191, 97, 106, 0.35)',
      label: 'STERN',
      badgeClass: 'badge-stern',
    },
  };

  const theme = emotionThemeMap[emotion] || emotionThemeMap.neutral;

  // Eyebrow SVG paths per emotion
  const getEyebrows = () => {
    switch (emotion) {
      case 'warm':
        return (
          <>
            <path d="M 65 85 Q 80 75 95 85" stroke="#eceff4" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M 105 85 Q 120 75 135 85" stroke="#eceff4" strokeWidth="4" strokeLinecap="round" fill="none" />
          </>
        );
      case 'skeptical':
        return (
          <>
            {/* Left eyebrow raised high */}
            <path d="M 62 70 Q 80 65 95 78" stroke="#ebcb8b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            {/* Right eyebrow flat / lowered */}
            <path d="M 105 85 Q 120 88 138 84" stroke="#ebcb8b" strokeWidth="4" strokeLinecap="round" fill="none" />
          </>
        );
      case 'impressed':
        return (
          <>
            <path d="M 62 72 Q 80 60 98 72" stroke="#a3be8c" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M 102 72 Q 120 60 138 72" stroke="#a3be8c" strokeWidth="4" strokeLinecap="round" fill="none" />
          </>
        );
      case 'stern':
        return (
          <>
            {/* Furrowed angled eyebrows */}
            <path d="M 62 78 L 96 90" stroke="#bf616a" strokeWidth="5" strokeLinecap="round" />
            <path d="M 104 90 L 138 78" stroke="#bf616a" strokeWidth="5" strokeLinecap="round" />
          </>
        );
      case 'neutral':
      default:
        return (
          <>
            <line x1="65" y1="82" x2="95" y2="82" stroke="#eceff4" strokeWidth="4" strokeLinecap="round" />
            <line x1="105" y1="82" x2="135" y2="82" stroke="#eceff4" strokeWidth="4" strokeLinecap="round" />
          </>
        );
    }
  };

  // Eyes SVG paths per emotion
  const getEyes = () => {
    switch (emotion) {
      case 'warm':
        return (
          <>
            <path d="M 70 102 Q 80 94 90 102" stroke="#eceff4" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M 110 102 Q 120 94 130 102" stroke="#eceff4" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            {/* Cheeks blush */}
            <ellipse cx="64" cy="115" rx="8" ry="4" fill="rgba(180, 142, 173, 0.4)" />
            <ellipse cx="136" cy="115" rx="8" ry="4" fill="rgba(180, 142, 173, 0.4)" />
          </>
        );
      case 'skeptical':
        return (
          <>
            {/* Left eye wide */}
            <circle cx="80" cy="100" r="7" fill="#eceff4" />
            <circle cx="81" cy="99" r="2.5" fill="#2e3440" />
            {/* Right eye squinting */}
            <line x1="110" y1="100" x2="130" y2="100" stroke="#ebcb8b" strokeWidth="3.5" strokeLinecap="round" />
          </>
        );
      case 'impressed':
        return (
          <>
            <circle cx="80" cy="98" r="8.5" fill="#eceff4" />
            <circle cx="80" cy="98" r="4" fill="#1e2b27" />
            <circle cx="78" cy="96" r="1.8" fill="#ffffff" />
            <circle cx="120" cy="98" r="8.5" fill="#eceff4" />
            <circle cx="120" cy="98" r="4" fill="#1e2b27" />
            <circle cx="118" cy="96" r="1.8" fill="#ffffff" />
          </>
        );
      case 'stern':
        return (
          <>
            <circle cx="80" cy="102" r="6.5" fill="#eceff4" />
            <circle cx="80" cy="102" r="3" fill="#bf616a" />
            <circle cx="120" cy="102" r="6.5" fill="#eceff4" />
            <circle cx="120" cy="102" r="3" fill="#bf616a" />
          </>
        );
      case 'neutral':
      default:
        return (
          <>
            <circle cx="80" cy="100" r="6.5" fill="#eceff4" />
            <circle cx="80" cy="100" r="3" fill="#2e3440" />
            <circle cx="120" cy="100" r="6.5" fill="#eceff4" />
            <circle cx="120" cy="100" r="3" fill="#2e3440" />
          </>
        );
    }
  };

  // Mouth SVG paths per emotion & status
  const getMouth = () => {
    if (isSpeaking) {
      return (
        <g className="avatar-mouth-speaking">
          <ellipse cx="100" cy="132" rx="14" ry="10" fill="#eceff4" />
          <ellipse cx="100" cy="134" rx="10" ry="6" fill="#bf616a" />
        </g>
      );
    }

    switch (emotion) {
      case 'warm':
        return <path d="M 85 128 Q 100 140 115 128" stroke="#eceff4" strokeWidth="4" strokeLinecap="round" fill="none" />;
      case 'skeptical':
        return <path d="M 86 134 Q 100 128 114 130" stroke="#ebcb8b" strokeWidth="4" strokeLinecap="round" fill="none" />;
      case 'impressed':
        return (
          <path
            d="M 84 126 Q 100 142 116 126 Z"
            fill="#a3be8c"
            stroke="#eceff4"
            strokeWidth="2"
          />
        );
      case 'stern':
        return <line x1="86" y1="132" x2="114" y2="132" stroke="#bf616a" strokeWidth="4.5" strokeLinecap="round" />;
      case 'neutral':
      default:
        return <line x1="88" y1="130" x2="112" y2="130" stroke="#eceff4" strokeWidth="3.5" strokeLinecap="round" />;
    }
  };

  return (
    <div
      className={`avatar-container ${isSpeaking ? 'is-speaking' : ''}`}
      style={{
        backgroundColor: theme.bg,
        borderColor: theme.border,
        boxShadow: `0 0 24px ${theme.glow}`,
      }}
    >
      <div className="avatar-header">
        <span className={`status-badge ${isSpeaking ? 'status-speaking' : 'status-idle'}`}>
          {status === 'speaking'
            ? '● SPEAKING'
            : status === 'listening'
            ? '🔴 LISTENING'
            : status === 'user_finished'
            ? '✓ USER FINISHED'
            : status === 'agent_processing'
            ? '⚙ PROCESSING'
            : '○ IDLE'}
        </span>
        <span className={`emotion-badge ${theme.badgeClass}`}>
          {theme.label}
        </span>
      </div>

      <div className="avatar-graphic">
        <svg viewBox="0 0 200 200" width="180" height="180" className="avatar-svg">
          {/* Outer glow background ring */}
          <circle cx="100" cy="100" r="88" fill="none" stroke={theme.border} strokeWidth="2" opacity="0.4" />
          
          {/* Head base */}
          <circle cx="100" cy="100" r="72" fill="#2e3440" stroke={theme.border} strokeWidth="3" />

          {/* Shoulders / suit neck */}
          <path d="M 40 185 Q 100 145 160 185 Z" fill="#3b4252" opacity="0.8" />
          <path d="M 85 152 L 100 175 L 115 152 Z" fill="#4c566a" />

          {/* Eyebrows */}
          {getEyebrows()}

          {/* Eyes */}
          {getEyes()}

          {/* Nose */}
          <path d="M 100 108 L 97 118 L 103 118" stroke="#4c566a" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Mouth */}
          {getMouth()}
        </svg>
      </div>
    </div>
  );
};
