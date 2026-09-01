import React from 'react';
import type { AvatarStatus, Emotion } from '../types/persona';

interface Avatar2DProps {
  status: AvatarStatus;
  emotion: Emotion;
}

export const Avatar2D: React.FC<Avatar2DProps> = ({ status, emotion }) => {
  const isSpeaking = status === 'speaking';

  const emotionLabelMap: Record<Emotion, { label: string; badgeBg: string; textColor: string }> = {
    neutral: { label: 'NEUTRAL', badgeBg: '#F4F4F4', textColor: '#191817' },
    warm: { label: 'WARM', badgeBg: '#E8F2FF', textColor: '#0F62FE' },
    skeptical: { label: 'SKEPTICAL', badgeBg: '#FFF3E0', textColor: '#D97706' },
    impressed: { label: 'IMPRESSED', badgeBg: '#E6F4EA', textColor: '#137333' },
    stern: { label: 'STERN', badgeBg: '#FCE8E6', textColor: '#C5221F' },
  };

  const currentEmotion = emotionLabelMap[emotion] || emotionLabelMap.neutral;

  // Dynamic Eyebrows
  const getEyebrows = () => {
    switch (emotion) {
      case 'warm':
        return (
          <g className="eyebrows-group">
            <path d="M 68 76 Q 84 66 98 75" stroke="#191817" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M 102 75 Q 116 66 132 76" stroke="#191817" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </g>
        );
      case 'skeptical':
        return (
          <g className="eyebrows-group">
            {/* Left raised */}
            <path d="M 66 64 Q 84 56 98 70" stroke="#191817" strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* Right lowered */}
            <path d="M 102 78 Q 116 80 134 77" stroke="#191817" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </g>
        );
      case 'impressed':
        return (
          <g className="eyebrows-group">
            <path d="M 66 66 Q 84 54 100 66" stroke="#0F62FE" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M 100 66 Q 116 54 134 66" stroke="#0F62FE" strokeWidth="4" strokeLinecap="round" fill="none" />
          </g>
        );
      case 'stern':
        return (
          <g className="eyebrows-group">
            <path d="M 66 74 L 98 84" stroke="#191817" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 102 84 L 134 74" stroke="#191817" strokeWidth="4.5" strokeLinecap="round" />
          </g>
        );
      case 'neutral':
      default:
        return (
          <g className="eyebrows-group">
            <path d="M 68 74 Q 84 72 98 74" stroke="#191817" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M 102 74 Q 116 72 132 74" stroke="#191817" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </g>
        );
    }
  };

  // Expressive Almond Eyes with Pupil Highlights
  const getEyes = () => {
    switch (emotion) {
      case 'warm':
        return (
          <g className="eyes-group">
            {/* Smiling eyes arcs */}
            <path d="M 70 92 Q 83 82 96 92" stroke="#191817" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M 104 92 Q 117 82 130 92" stroke="#191817" strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* Cheek blushes */}
            <ellipse cx="66" cy="106" rx="9" ry="4" fill="rgba(15, 98, 254, 0.12)" />
            <ellipse cx="134" cy="106" rx="9" ry="4" fill="rgba(15, 98, 254, 0.12)" />
          </g>
        );
      case 'skeptical':
        return (
          <g className="eyes-group">
            {/* Left eye wide */}
            <path d="M 70 92 Q 83 80 96 92 Q 83 100 70 92 Z" fill="#FFFFFF" stroke="#191817" strokeWidth="2.5" />
            <circle cx="83" cy="90" r="5" fill="#0F62FE" />
            <circle cx="83" cy="90" r="2.5" fill="#191817" />
            <circle cx="81" cy="88" r="1.2" fill="#FFFFFF" />
            {/* Right eye squinting */}
            <line x1="104" y1="92" x2="130" y2="92" stroke="#191817" strokeWidth="4" strokeLinecap="round" />
          </g>
        );
      case 'impressed':
        return (
          <g className="eyes-group">
            <path d="M 68 91 Q 83 78 98 91 Q 83 102 68 91 Z" fill="#FFFFFF" stroke="#191817" strokeWidth="2.5" />
            <circle cx="83" cy="90" r="6" fill="#0F62FE" />
            <circle cx="83" cy="90" r="3" fill="#191817" />
            <circle cx="80" cy="87" r="1.5" fill="#FFFFFF" />
            
            <path d="M 102 91 Q 117 78 132 91 Q 117 102 102 91 Z" fill="#FFFFFF" stroke="#191817" strokeWidth="2.5" />
            <circle cx="117" cy="90" r="6" fill="#0F62FE" />
            <circle cx="117" cy="90" r="3" fill="#191817" />
            <circle cx="114" cy="87" r="1.5" fill="#FFFFFF" />
          </g>
        );
      case 'stern':
        return (
          <g className="eyes-group">
            <path d="M 70 94 Q 83 86 96 94 Q 83 102 70 94 Z" fill="#FFFFFF" stroke="#191817" strokeWidth="2.5" />
            <circle cx="83" cy="94" r="4.5" fill="#C5221F" />
            <circle cx="83" cy="94" r="2" fill="#191817" />
            
            <path d="M 104 94 Q 117 86 130 94 Q 117 102 104 94 Z" fill="#FFFFFF" stroke="#191817" strokeWidth="2.5" />
            <circle cx="117" cy="94" r="4.5" fill="#C5221F" />
            <circle cx="117" cy="94" r="2" fill="#191817" />
          </g>
        );
      case 'neutral':
      default:
        return (
          <g className="eyes-group">
            <path d="M 70 92 Q 83 82 96 92 Q 83 100 70 92 Z" fill="#FFFFFF" stroke="#191817" strokeWidth="2.5" />
            <circle cx="83" cy="91" r="5" fill="#0F62FE" />
            <circle cx="83" cy="91" r="2.5" fill="#191817" />
            <circle cx="81" cy="89" r="1.2" fill="#FFFFFF" />
            
            <path d="M 104 92 Q 117 82 130 92 Q 117 100 104 92 Z" fill="#FFFFFF" stroke="#191817" strokeWidth="2.5" />
            <circle cx="117" cy="91" r="5" fill="#0F62FE" />
            <circle cx="117" cy="91" r="2.5" fill="#191817" />
            <circle cx="115" cy="89" r="1.2" fill="#FFFFFF" />
          </g>
        );
    }
  };

  // Mouth & Lip Motion
  const getMouth = () => {
    if (isSpeaking) {
      return (
        <g className="mouth-speaking-group">
          <path d="M 84 122 Q 100 144 116 122 Z" fill="#191817" stroke="#191817" strokeWidth="2" />
          <path d="M 88 123 Q 100 130 112 123 Z" fill="#FFFFFF" />
          <ellipse cx="100" cy="133" rx="7" ry="4" fill="#0F62FE" />
        </g>
      );
    }

    switch (emotion) {
      case 'warm':
        return <path d="M 86 122 Q 100 134 114 122" stroke="#191817" strokeWidth="3.5" strokeLinecap="round" fill="none" />;
      case 'skeptical':
        return <path d="M 86 127 Q 100 120 114 124" stroke="#191817" strokeWidth="3.5" strokeLinecap="round" fill="none" />;
      case 'impressed':
        return (
          <path
            d="M 84 122 Q 100 140 116 122 Z"
            fill="#0F62FE"
            stroke="#191817"
            strokeWidth="2.5"
          />
        );
      case 'stern':
        return <line x1="86" y1="126" x2="114" y2="126" stroke="#191817" strokeWidth="4" strokeLinecap="round" />;
      case 'neutral':
      default:
        return <path d="M 86 124 Q 100 128 114 124" stroke="#191817" strokeWidth="3.5" strokeLinecap="round" fill="none" />;
    }
  };

  return (
    <div className={`sleek-humanoid-wrapper humanoid-figure-wrapper ${isSpeaking ? 'is-speaking' : ''}`}>
      <div className="avatar-emotion-tag" style={{ backgroundColor: currentEmotion.badgeBg, color: currentEmotion.textColor }}>
        EXPRESSION: {currentEmotion.label}
      </div>

      <div className="avatar-graphic-container">
        <svg viewBox="0 0 200 200" className="avatar-svg-responsive">
          {/* Base Sleek Floor Shadow */}
          <ellipse cx="100" cy="188" rx="80" ry="8" fill="#E2E8F0" stroke="#191817" strokeWidth="1.5" />
          
          {/* Outer Persona Ring */}
          <circle cx="100" cy="96" r="88" fill="none" stroke="#191817" strokeWidth="2" strokeDasharray="4 4" opacity="0.4" />

          {/* Sleek Dark Hair Back Silhouette */}
          <path d="M 48 90 C 46 32, 154 32, 152 90 Z" fill="#191817" />

          {/* Neck */}
          <rect x="88" y="126" width="24" height="26" rx="4" fill="#FFFFFF" stroke="#191817" strokeWidth="2.5" />
          <path d="M 88 132 L 100 144 L 112 132" stroke="#CBD5E1" strokeWidth="1.5" fill="none" />

          {/* Modern Head Oval */}
          <path d="M 52 78 C 50 42, 150 42, 148 78 C 146 122, 132 138, 100 138 C 68 138, 54 122, 52 78 Z" fill="#FFFFFF" stroke="#191817" strokeWidth="3" />

          {/* Styled Front Hairlines */}
          <path d="M 52 72 Q 80 44 100 58 Q 128 44 148 72 Q 132 48 100 48 Q 68 48 52 72 Z" fill="#191817" />

          {/* Sculpted Ears */}
          <path d="M 52 86 C 45 86, 45 102, 52 102 Z" fill="#FFFFFF" stroke="#191817" strokeWidth="2.5" />
          <path d="M 148 86 C 155 86, 155 102, 148 102 Z" fill="#FFFFFF" stroke="#191817" strokeWidth="2.5" />

          {/* Tailored Tech Suit / Blazer */}
          <path d="M 28 188 Q 100 142 172 188 Z" fill="#191817" stroke="#191817" strokeWidth="2" />
          {/* Shirt Collar */}
          <path d="M 82 148 L 100 176 L 118 148 Z" fill="#FFFFFF" stroke="#191817" strokeWidth="2" />
          {/* IBM Blue Tie */}
          <path d="M 94 154 L 100 182 L 106 154 Z" fill="#0F62FE" />

          {/* Eyebrows */}
          {getEyebrows()}

          {/* Eyes */}
          {getEyes()}

          {/* Sculpted Nose Bridge */}
          <path d="M 100 90 L 96 104 L 102 104" stroke="#191817" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

          {/* Mouth */}
          {getMouth()}
        </svg>
      </div>
    </div>
  );
};
