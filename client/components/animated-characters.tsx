"use client"

import React, { useState } from "react"
import { motion, useAnimation } from "framer-motion"
import Image from "next/image"

type Props = {
  size?: number
  className?: string
  src?: string // External image/SVG URL
  alt?: string
}

/**
 * HRCharacter
 * High-fidelity pseudo-3D SVG avatar based on the uploaded image.
 * Includes: floating bob, blinking, and light shimmer over the blazer.
 * Supports external SVG/image URLs via src prop.
 */
export function HRCharacter({ size = 160, className = "", src, alt = "HR Assistant" }: Props) {
  const [imageError, setImageError] = useState(false)
  
  // If external image is provided, use it
  if (src && !imageError) {
    return (
      <motion.div
        className={`relative inline-block ${className}`}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: size, height: size }}
      >
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="w-full h-full object-contain rounded-full"
          onError={() => setImageError(true)}
          style={{ borderRadius: '50%' }}
        />
      </motion.div>
    )
  }

  // timings for blink & shimmer
  const blinkCycle = { duration: 4.5, repeat: Infinity, ease: "easeInOut" as const } // random-feeling interval
  const shimmerCycle = { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const }

  return (
    <motion.div
      className={`relative inline-block ${className}`}
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      style={{ width: size, height: size }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 220"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Animated HR character avatar"
      >
        <defs>
          {/* Soft overall shadow */}
          <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
            <feOffset dx="0" dy="6" result="off" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.25" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="off" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Head skin gradient */}
          <radialGradient id="skinGrad" cx="45%" cy="34%" r="60%">
            <stop offset="0%" stopColor="#fde1c6" />
            <stop offset="55%" stopColor="#f6c89b" />
            <stop offset="100%" stopColor="#e7b48a" />
          </radialGradient>

          {/* Hair gradient / glossy highlight */}
          <linearGradient id="hairGrad" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#0f0f0f" />
            <stop offset="40%" stopColor="#151515" />
            <stop offset="100%" stopColor="#2a2a2a" />
          </linearGradient>

          {/* Blazer base gradient */}
          <linearGradient id="blazerGrad" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#6b7280" />
            <stop offset="40%" stopColor="#5f6570" />
            <stop offset="100%" stopColor="#4b5563" />
          </linearGradient>

          {/* Subtle highlight for 3D fold */}
          <linearGradient id="blazerHighlight" x1="0%" x2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          {/* Skirt pleat gradient */}
          <linearGradient id="skirtGrad" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#5b616a" />
            <stop offset="100%" stopColor="#3f4550" />
          </linearGradient>

          {/* Shirt gradient */}
          <linearGradient id="shirtGrad" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#eef2f7" />
          </linearGradient>

          {/* Tie gradient */}
          <linearGradient id="tieGrad" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#2b344d" />
            <stop offset="100%" stopColor="#17214a" />
          </linearGradient>

          {/* Glassy cheek highlight radial */}
          <radialGradient id="cheekHighlight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          {/* animated shimmer: we animate the gradient transform using framer - create a gradient with id */}
          <linearGradient id="shimmer" x1="0" x2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0)" />
            <stop offset="0.45" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="0.55" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="1" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* background circle / subtle backdrop */}
        <g filter="url(#softShadow)">
          <circle cx="100" cy="110" r="96" fill="#EEF2FF" opacity={0.15} />
        </g>

        {/* torso + clothing group */}
        <g transform="translate(0,40)">
          {/* skirt (pleated) */}
          <g id="skirt">
            <path
              d="M48 118 L152 118 L138 170 Q120 190 100 190 Q80 190 62 170 Z"
              fill="url(#skirtGrad)"
              stroke="rgba(0,0,0,0.06)"
              strokeWidth="0.6"
            />
            {/* pleat lines */}
            <path d="M80 118 L80 168" stroke="rgba(0,0,0,0.08)" strokeWidth="0.6" />
            <path d="M100 118 L100 168" stroke="rgba(0,0,0,0.08)" strokeWidth="0.6" />
            <path d="M120 118 L120 168" stroke="rgba(0,0,0,0.08)" strokeWidth="0.6" />
          </g>

          {/* blazer base */}
          <g id="blazer" transform="translate(0,0)">
            <path
              d="M40 36 L160 36 L168 120 L32 120 Z"
              fill="url(#blazerGrad)"
              stroke="rgba(0,0,0,0.08)"
              strokeWidth="0.8"
              rx="2"
            />
            {/* lapels */}
            <path d="M62 36 L86 72 L68 76 L56 44 Z" fill="url(#blazerHighlight)" opacity={0.9} />
            <path d="M138 36 L114 72 L132 76 L144 44 Z" fill="url(#blazerHighlight)" opacity={0.9} />
            {/* buttons */}
            <circle cx="104" cy="80" r="3" fill="#2f3338" />
            <circle cx="104" cy="96" r="3" fill="#2f3338" />
            {/* pocket square */}
            <path d="M50 64 L60 76 L44 74 Z" fill="#fff" opacity={0.95} />
            {/* subtle fold shading */}
            <path d="M60 60 Q100 84 140 60 L140 66 Q100 90 60 66 Z" fill="rgba(0,0,0,0.04)" />
          </g>

          {/* shirt & vest & tie */}
          <g id="shirt">
            <path d="M72 40 L128 40 L128 84 L72 84 Z" fill="url(#shirtGrad)" />
            <path d="M76 44 L124 44 L100 92 Z" fill="url(#tieGrad)" />
            {/* tie knot highlight */}
            <path d="M92 44 L108 44 L100 60 Z" fill="rgba(255,255,255,0.06)" />
            {/* vest darker */}
            <path d="M72 60 L128 60 L120 84 L80 84 Z" fill="rgba(40,45,50,0.12)" />
          </g>

          {/* legs & socks */}
          <g id="legs">
            <path d="M84 168 L92 168 L96 210 L80 210 Z" fill="#f5d0a9" />
            <path d="M116 168 L124 168 L132 210 L116 210 Z" fill="#f5d0a9" />
            {/* socks */}
            <rect x="82" y="186" width="18" height="18" rx="3" fill="#0b0b0b" />
            <rect x="110" y="186" width="18" height="18" rx="3" fill="#0b0b0b" />
            {/* white stripes on one sock */}
            <rect x="82" y="190" width="18" height="3" fill="#fff" opacity={0.95} />
            <rect x="82" y="196" width="18" height="3" fill="#fff" opacity={0.95} />
            {/* shoes (slightly glossy) */}
            <path d="M76 204 Q92 216 104 210 L96 210 Q84 214 76 204 Z" fill="#111317" opacity={0.95} />
            <path d="M116 210 Q132 216 144 204 Q136 214 124 210 Z" fill="#111317" opacity={0.95} />
          </g>
        </g>

        {/* head + hair group - we'll animate blink by overlaying eyelids */}
        <g id="head" transform="translate(0,0)">
          {/* hair behind head shadow */}
          <path
            d="M36 46 C30 38 30 28 34 20 C46 6 154 6 166 20 C170 28 170 38 164 46 C158 54 142 76 100 84 C58 76 42 54 36 46 Z"
            fill="url(#hairGrad)"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="0.6"
          />

          {/* head base (skin) */}
          <ellipse cx="100" cy="84" rx="44" ry="52" fill="url(#skinGrad)" stroke="rgba(0,0,0,0.04)" />

          {/* cheek subtle highlight */}
          <ellipse cx="78" cy="96" rx="9" ry="6" fill="url(#cheekHighlight)" opacity={0.9} />

          {/* hair front fringe / bob */}
          <path
            d="M40 68 C46 52 60 40 86 44 C98 46 120 42 130 48 C148 60 154 88 146 108 C136 132 120 144 100 144 C80 144 64 130 56 110 C50 96 46 80 40 68 Z"
            fill="url(#hairGrad)"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="0.5"
          />

          {/* ear hoop earrings */}
          <circle cx="64" cy="104" r="3" fill="none" stroke="#C0C0C0" strokeWidth="1.2" />
          <circle cx="136" cy="104" r="3" fill="none" stroke="#C0C0C0" strokeWidth="1.2" />

          {/* neck */}
          <rect x="86" y="132" rx="3" ry="3" width="28" height="18" fill="url(#skinGrad)" />

          {/* eyes group */}
          <g id="eyes" transform="translate(0,0)">
            {/* left eye white */}
            <ellipse cx="82" cy="86" rx="8" ry="5.6" fill="#FFF" stroke="rgba(0,0,0,0.06)" />
            {/* left iris */}
            <ellipse cx="82" cy="86" rx="4.3" ry="3.2" fill="#4A2C1A" />
            <circle cx="82" cy="86" r="1.8" fill="#0b0b0b" />
            <circle cx="84" cy="85" r="0.9" fill="#fff" />

            {/* right eye white */}
            <ellipse cx="118" cy="86" rx="8" ry="5.6" fill="#FFF" stroke="rgba(0,0,0,0.06)" />
            {/* right iris */}
            <ellipse cx="118" cy="86" rx="4.3" ry="3.2" fill="#4A2C1A" />
            <circle cx="118" cy="86" r="1.8" fill="#0b0b0b" />
            <circle cx="120" cy="85" r="0.9" fill="#fff" />

            {/* eyeliner / lash curve */}
            <path d="M74 82 Q82 78 90 82" stroke="#000" strokeWidth="2" strokeLinecap="round" fill="none" opacity={0.95} />
            <path d="M110 82 Q118 78 126 82" stroke="#000" strokeWidth="2" strokeLinecap="round" fill="none" opacity={0.95} />

            {/* eyebrows */}
            <path d="M74 76 Q82 73 90 76" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M110 76 Q118 73 126 76" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" fill="none" />

            {/* animated eyelids (blink). We'll animate their scaleY to create blink. */}
            <motion.g
              id="blink-lids"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: [0, 1, 0] }}
              transition={{
                duration: blinkCycle.duration,
                repeat: blinkCycle.repeat,
                ease: blinkCycle.ease,
                times: [0, 0.07, 1], // quick close, long open
                repeatDelay: 3
              }}
              style={{ transformOrigin: "82px 86px" }}
            >
              <rect x="74" y="82" width="16" height="12" rx="6" fill="#F5D0A9" />
            </motion.g>

            <motion.g
              id="blink-lids-2"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: [0, 1, 0] }}
              transition={{
                duration: blinkCycle.duration,
                repeat: blinkCycle.repeat,
                ease: blinkCycle.ease,
                times: [0, 0.07, 1],
                repeatDelay: 3.2
              }}
              style={{ transformOrigin: "118px 86px" }}
            >
              <rect x="110" y="82" width="16" height="12" rx="6" fill="#F5D0A9" />
            </motion.g>
          </g>

          {/* nose */}
          <path d="M100 96 Q98 100 100 104 Q102 100 100 96" fill="rgba(0,0,0,0.04)" />

          {/* mouth subtle */}
          <path d="M92 112 Q100 118 108 112" stroke="#D4A574" strokeWidth="1.8" fill="none" strokeLinecap="round" />

          {/* small chin shadow */}
          <ellipse cx="100" cy="124" rx="24" ry="6" fill="rgba(0,0,0,0.03)" />
        </g>

        {/* dynamic shimmer overlay on blazer: animate gradient transform to sweep left->right */}
        <motion.g
          style={{ mixBlendMode: "screen" }}
          animate={{ translateX: [ -80, 80, -80 ] }}
          transition={{
            duration: shimmerCycle.duration,
            repeat: shimmerCycle.repeat,
            ease: shimmerCycle.ease
          }}
        >
          <path
            d="M40 76 L160 36 L168 120 L32 120 Z"
            fill="url(#shimmer)"
            opacity={0.65}
            transform="skewX(-18)"
          />
        </motion.g>

        {/* subtle glossy highlight on hair (animated pulse) */}
        <motion.path
          d="M58 52 C74 44 86 46 102 50 C118 54 134 52 144 60"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          animate={{ opacity: [0.2, 0.7, 0.2], translateX: [0, 2, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />

      </svg>
    </motion.div>
  )
}

/**
 * JobseekerCharacter
 * Simpler professional male with gentle floating animation (keeps your original structure).
 */
export function JobseekerCharacter({ size = 120, className = "", src, alt = "Jobseeker" }: Props) {
  const [imageError, setImageError] = useState(false)
  
  // If external image is provided, use it
  if (src && !imageError) {
    return (
      <motion.div
        className={`relative ${className}`}
        animate={{
          y: [0, -3, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
        style={{ width: size, height: size }}
      >
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="w-full h-full object-contain rounded-full"
          onError={() => setImageError(true)}
          style={{ borderRadius: '50%' }}
        />
      </motion.div>
    )
  }

  return (
    <motion.div
      className={`relative inline-block ${className}`}
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 200 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="jsSkin" cx="45%" cy="34%" r="60%">
            <stop offset="0%" stopColor="#fde1c6" />
            <stop offset="100%" stopColor="#e7b48a" />
          </radialGradient>
          <linearGradient id="jsSuit" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#374151" />
            <stop offset="1" stopColor="#1f2937" />
          </linearGradient>
        </defs>

        <circle cx="100" cy="110" r="96" fill="#EDEFF4" opacity={0.16} />
        <ellipse cx="100" cy="72" rx="42" ry="48" fill="url(#jsSkin)" />
        <path d="M56 62 C68 46 132 46 144 62 C148 78 138 100 128 112 C110 126 90 126 72 112 C62 100 52 78 56 62 Z" fill="#6B4423" />
        <ellipse cx="80" cy="76" rx="8" ry="6" fill="#fff" />
        <ellipse cx="80" cy="76" rx="4" ry="3.2" fill="#1F2937" />
        <ellipse cx="120" cy="76" rx="8" ry="6" fill="#fff" />
        <ellipse cx="120" cy="76" rx="4" ry="3.2" fill="#1F2937" />
        <rect x="76" y="120" width="48" height="56" rx="4" fill="url(#jsSuit)" />
        <rect x="88" y="120" width="24" height="44" rx="2" fill="#fff" />
        <path d="M96 120 L104 132 L112 120 L112 160 L96 160 Z" fill="#1E40AF" />
      </svg>
    </motion.div>
  )
}

/**
 * ChatbotButtonCharacter
 * Circular small avatar used in UI/button. Similar style to HRCharacter but compact.
 * Supports external SVG/image URLs via src prop.
 */
export function ChatbotButtonCharacter({ size = 88, src, alt = "Chatbot Assistant" }: Props) {
  const [imageError, setImageError] = useState(false)
  
  // If external image is provided, use it
  if (src && !imageError) {
    return (
      <motion.div
        className="relative"
        animate={{
          scale: [1, 1.05, 1],
          y: [0, -3, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ width: size, height: size }}
      >
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="w-full h-full object-contain rounded-full"
          onError={() => setImageError(true)}
          style={{ borderRadius: '50%' }}
        />
      </motion.div>
    )
  }

  return (
    <motion.div
      className="relative inline-block"
      animate={{
        scale: [1, 1.05, 1],
        y: [0, -3, 0]
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img">
        <defs>
          <radialGradient id="cbSkin" cx="45%" cy="34%" r="60%">
            <stop offset="0%" stopColor="#fde1c6" />
            <stop offset="100%" stopColor="#e7b48a" />
          </radialGradient>
          <linearGradient id="cbHair" x1="0" x2="1">
            <stop offset="0" stopColor="#0f0f0f" />
            <stop offset="1" stopColor="#2a2a2a" />
          </linearGradient>
          <linearGradient id="cbBlazer" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#3b82f6" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
        </defs>

        {/* background circle */}
        <circle cx="100" cy="100" r="96" fill="#3B82F6" opacity={0.12} />
        <circle cx="100" cy="100" r="78" fill="#3B82F6" />

        {/* head */}
        <ellipse cx="100" cy="70" rx="36" ry="44" fill="url(#cbSkin)" />
        <path d="M58 64 C66 48 86 36 100 40 C114 44 134 40 142 50 C148 66 148 78 138 92 C130 104 116 112 100 112 C84 112 70 102 62 90 C58 80 56 70 58 64 Z" fill="url(#cbHair)" />
        {/* eyes */}
        <ellipse cx="86" cy="72" rx="6" ry="4" fill="#fff" />
        <ellipse cx="86" cy="72" rx="3" ry="2.2" fill="#4a2c1a" />
        <circle cx="86" cy="72" r="1.2" fill="#000" />
        <ellipse cx="114" cy="72" rx="6" ry="4" fill="#fff" />
        <ellipse cx="114" cy="72" rx="3" ry="2.2" fill="#4a2c1a" />
        <circle cx="114" cy="72" r="1.2" fill="#000" />

        {/* blazer */}
        <path d="M58 120 L142 120 L150 160 L50 160 Z" fill="#6B7280" />
        <path d="M70 120 L86 140 L76 144 L66 122 Z" fill="#5B6170" />
        <path d="M130 120 L114 140 L124 144 L134 122 Z" fill="#5B6170" />
      </svg>
    </motion.div>
  )
}

export default HRCharacter
