'use client';

// No custom properties needed

import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload,
  BarChart3,
  BookOpenIcon,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useWalkthrough } from '@/components/walkthrough/walkthrough-provider';

const colors = {
  50: '#f8f7f5',
  100: '#e6e1d7',
  200: '#c8b4a0',
  300: '#a89080',
  400: '#8a7060',
  500: '#6b5545',
  600: '#544237',
  700: '#3c4237',
  800: '#2a2e26',
  900: '#1a1d18',
};

export function HeroSection() {
  const gradientRef = useRef<HTMLDivElement>(null);
  const { startWalkthrough, hasSeenWalkthrough } = useWalkthrough();

  useEffect(() => {
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes word-appear {
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes pulse-glow {
        0% { 
          transform: translate(-50%, -50%) scale(1); 
          opacity: 0.6; 
        }
        100% { 
          transform: translate(-50%, -50%) scale(20); 
          opacity: 0; 
        }
      }
      
      @keyframes grid-line-appear {
        0% { stroke-dasharray: 1000; stroke-dashoffset: 1000; }
        100% { stroke-dasharray: 1000; stroke-dashoffset: 0; }
      }
      
      @keyframes detail-dot-appear {
        0% { opacity: 0; transform: scale(0); }
        100% { opacity: 0.6; transform: scale(1); }
      }
      
      @keyframes corner-element-appear {
        0% { opacity: 0; transform: scale(0); }
        100% { opacity: 1; transform: scale(1); }
      }
      
      @keyframes floating-element {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-10px) rotate(180deg); }
      }
      
      .word {
        display: inline-block;
        opacity: 0;
        margin-right: 0.3em;
        animation: word-appear 0.8s ease-out forwards;
      }
      
      .word[data-delay="0"] { animation-delay: 0s; }
      .word[data-delay="100"] { animation-delay: 0.1s; }
      .word[data-delay="200"] { animation-delay: 0.2s; }
      .word[data-delay="300"] { animation-delay: 0.3s; }
      .word[data-delay="400"] { animation-delay: 0.4s; }
      .word[data-delay="500"] { animation-delay: 0.5s; }
      
      .grid-line {
        stroke: rgba(200,180,160,0.1);
        stroke-width: 0.5;
        animation: grid-line-appear 2s ease-out forwards;
      }
      
      .detail-dot {
        fill: rgba(200,180,160,0.6);
        opacity: 0;
        animation: detail-dot-appear 0.8s ease-out forwards;
      }
      
      .corner-element {
        position: absolute;
        opacity: 0;
        animation: corner-element-appear 0.5s ease-out forwards;
      }
      
      .floating-element {
        position: absolute;
        width: 4px;
        height: 4px;
        background: rgba(200,180,160,0.3);
        border-radius: 50%;
        animation: floating-element 6s ease-in-out infinite;
        animation-play-state: running;
      }
      
      .word:hover {
        text-shadow: 0 0 20px rgba(200, 180, 160, 0.5);
        transition: text-shadow 0.3s ease;
      }
    `;
    document.head.appendChild(style);

    // Words will be animated via CSS only - no DOM manipulation

    // Mouse gradient
    const gradient = gradientRef.current;
    function onMouseMove(e: MouseEvent) {
      if (gradient) {
        gradient.style.left = e.clientX - 192 + 'px';
        gradient.style.top = e.clientY - 192 + 'px';
        gradient.style.opacity = '1';
      }
    }
    function onMouseLeave() {
      if (gradient) gradient.style.opacity = '0';
    }
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);

    // Word hover effects removed - using CSS only

    // Click ripple effect removed - using CSS only

    // Floating elements scroll effect removed - using CSS only

    return () => {
      // Safe cleanup of event listeners
      if (gradient && document.contains(gradient)) {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseleave', onMouseLeave);
      }
      
      // Safe removal of style element
      if (style && document.head && document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return (
    <div className="font-primary relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#1a1d18] via-black to-[#2a2e26] text-[#e6e1d7]">
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="rgba(200,180,160,0.08)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <line
          x1="0"
          y1="20%"
          x2="100%"
          y2="20%"
          className="grid-line"
          style={{ animationDelay: '0.5s' }}
        />
        <line
          x1="0"
          y1="80%"
          x2="100%"
          y2="80%"
          className="grid-line"
          style={{ animationDelay: '1s' }}
        />
        <line
          x1="20%"
          y1="0"
          x2="20%"
          y2="100%"
          className="grid-line"
          style={{ animationDelay: '1.5s' }}
        />
        <line
          x1="80%"
          y1="0"
          x2="80%"
          y2="100%"
          className="grid-line"
          style={{ animationDelay: '2s' }}
        />
        <line
          x1="50%"
          y1="0"
          x2="50%"
          y2="100%"
          className="grid-line"
          style={{ animationDelay: '2.5s', opacity: 0.05 }}
        />
        <line
          x1="0"
          y1="50%"
          x2="100%"
          y2="50%"
          className="grid-line"
          style={{ animationDelay: '3s', opacity: 0.05 }}
        />
        <circle
          cx="20%"
          cy="20%"
          r="2"
          className="detail-dot"
          style={{ animationDelay: '3s' }}
        />
        <circle
          cx="80%"
          cy="20%"
          r="2"
          className="detail-dot"
          style={{ animationDelay: '3.2s' }}
        />
        <circle
          cx="20%"
          cy="80%"
          r="2"
          className="detail-dot"
          style={{ animationDelay: '3.4s' }}
        />
        <circle
          cx="80%"
          cy="80%"
          r="2"
          className="detail-dot"
          style={{ animationDelay: '3.6s' }}
        />
        <circle
          cx="50%"
          cy="50%"
          r="1.5"
          className="detail-dot"
          style={{ animationDelay: '4s' }}
        />
      </svg>

      {/* Corner elements */}
      <div
        className="corner-element top-8 left-8"
        style={{ animationDelay: '4s' }}
      >
        <div
          className="absolute top-0 left-0 h-2 w-2 opacity-30"
          style={{ background: colors[200] }}
        ></div>
      </div>
      <div
        className="corner-element top-8 right-8"
        style={{ animationDelay: '4.2s' }}
      >
        <div
          className="absolute top-0 right-0 h-2 w-2 opacity-30"
          style={{ background: colors[200] }}
        ></div>
      </div>
      <div
        className="corner-element bottom-8 left-8"
        style={{ animationDelay: '4.4s' }}
      >
        <div
          className="absolute bottom-0 left-0 h-2 w-2 opacity-30"
          style={{ background: colors[200] }}
        ></div>
      </div>
      <div
        className="corner-element right-8 bottom-8"
        style={{ animationDelay: '4.6s' }}
      >
        <div
          className="absolute right-0 bottom-0 h-2 w-2 opacity-30"
          style={{ background: colors[200] }}
        ></div>
      </div>

      {/* Floating elements */}
      <div
        className="floating-element"
        style={{ top: '25%', left: '15%', animationDelay: '5s' }}
      ></div>
      <div
        className="floating-element"
        style={{ top: '60%', left: '85%', animationDelay: '5.5s' }}
      ></div>
      <div
        className="floating-element"
        style={{ top: '40%', left: '10%', animationDelay: '6s' }}
      ></div>
      <div
        className="floating-element"
        style={{ top: '75%', left: '90%', animationDelay: '6.5s' }}
      ></div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-between px-8 py-12 md:px-16 md:py-20">
        {/* Top tagline */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100/10 backdrop-blur-sm text-[#c8b4a0] px-4 py-2 rounded-full text-sm font-medium mb-6 border border-[#c8b4a0]/20">
            <CheckCircle className="h-4 w-4" />
            <span className="word" data-delay="0">Hackathon</span>
            <span className="word" data-delay="200">Demo:</span>
            <span className="word" data-delay="400">Smart</span>
            <span className="word" data-delay="600">IPDR</span>
            <span className="word" data-delay="800">Analysis</span>
            <span className="word" data-delay="1000">Tool</span>
          </div>
          <div
            className="mt-4 h-px w-16 opacity-30 mx-auto"
            style={{
              background: `linear-gradient(to right, transparent, ${colors[200]}, transparent)`,
            }}
          ></div>
        </div>

        {/* Main headline */}
        <div className="mx-auto max-w-5xl text-center">
          <h1
            className="text-decoration text-3xl leading-tight font-extralight tracking-tight md:text-5xl lg:text-6xl"
            style={{ color: colors[50] }}
          >
            <div className="mb-4 md:mb-6">
              <span className="word" data-delay="1600">
                IPDR-Intel+
              </span>
            </div>
            <div
              className="text-2xl leading-relaxed font-thin md:text-3xl lg:text-4xl"
              style={{ color: colors[200] }}
            >
              <span className="word" data-delay="2000">
                Extract
              </span>
              <span className="word" data-delay="2150">
                and
              </span>
              <span className="word" data-delay="2300">
                identify
              </span>
              <span className="word" data-delay="2450">
                <strong>B-party</strong>
              </span>
              <span className="word" data-delay="2600">
                recipients
              </span>
              <span className="word" data-delay="2750">
                from
              </span>
              <span className="word" data-delay="2900">
                IPDR
              </span>
              <span className="word" data-delay="3050">
                logs
              </span>
            </div>
            <div
              className="text-xl leading-relaxed font-thin md:text-2xl lg:text-3xl mt-4"
              style={{ color: colors[300] }}
            >
              <span className="word" data-delay="3200">
                Accurate
              </span>
              <span className="word" data-delay="3350">
                A-party
              </span>
              <span className="word" data-delay="3500">
                to
              </span>
              <span className="word" data-delay="3650">
                B-party
              </span>
              <span className="word" data-delay="3800">
                mapping
              </span>
              <span className="word" data-delay="3950">
                for
              </span>
              <span className="word" data-delay="4100">
                law
              </span>
              <span className="word" data-delay="4250">
                enforcement
              </span>
            </div>
          </h1>
          
          {/* Action Buttons */}
          <div 
            className="mt-12 flex flex-wrap justify-center gap-4 opacity-0"
            style={{
              animation: 'word-appear 1s ease-out forwards',
              animationDelay: '4.5s',
            }}
          >
            <Button size="lg" asChild className="bg-[#6b5545] hover:bg-[#544237] text-white border-[#c8b4a0]/20">
              <Link href="/upload">
                <Upload className="h-5 w-5 mr-2" />
                Start Demo
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="border-[#c8b4a0]/30 text-[#c8b4a0] hover:bg-[#c8b4a0]/10">
              <Link href="/features">
                <BarChart3 className="h-5 w-5 mr-2" />
                View Features
              </Link>
            </Button>
            {!hasSeenWalkthrough && (
              <Button
                onClick={startWalkthrough}
                variant="outline"
                size="lg"
                className="border-[#c8b4a0]/30 text-[#c8b4a0] hover:bg-[#c8b4a0]/10"
              >
                <BookOpenIcon className="h-4 w-4 mr-2" />
                Take a Tour
              </Button>
            )}
          </div>

          {/* Key Stats */}
          <div 
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto opacity-0"
            style={{
              animation: 'word-appear 1s ease-out forwards',
              animationDelay: '5s',
            }}
          >
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: colors[200] }}>10+</div>
              <div className="text-sm" style={{ color: colors[300] }}>Key Tasks Solved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: colors[200] }}>GB+</div>
              <div className="text-sm" style={{ color: colors[300] }}>File Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: colors[200] }}>4</div>
              <div className="text-sm" style={{ color: colors[300] }}>Telecom Operators</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: colors[200] }}>100%</div>
              <div className="text-sm" style={{ color: colors[300] }}>Legal Compliant</div>
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="text-center">
          <div
            className="mb-4 h-px w-16 opacity-30 mx-auto"
            style={{
              background: `linear-gradient(to right, transparent, ${colors[200]}, transparent)`,
            }}
          ></div>
          <h2
            className="font-mono text-xs font-light tracking-[0.2em] uppercase opacity-80 md:text-sm"
            style={{ color: colors[200] }}
          >
            <span className="word" data-delay="5400">
              BSA
            </span>
            <span className="word" data-delay="5550">
              2023
            </span>
            <span className="word" data-delay="5700">
              compliant,
            </span>
            <span className="word" data-delay="5850">
              court-ready
            </span>
            <span className="word" data-delay="6000">
              reports,
            </span>
            <span className="word" data-delay="6150">
              chain
            </span>
            <span className="word" data-delay="6300">
              of
            </span>
            <span className="word" data-delay="6450">
              custody.
            </span>
          </h2>
          <div
            className="mt-6 flex justify-center space-x-4 opacity-0"
            style={{
              animation: 'word-appear 1s ease-out forwards',
              animationDelay: '6s',
            }}
          >
            <div
              className="h-1 w-1 rounded-full opacity-40"
              style={{ background: colors[200] }}
            ></div>
            <div
              className="h-1 w-1 rounded-full opacity-60"
              style={{ background: colors[200] }}
            ></div>
            <div
              className="h-1 w-1 rounded-full opacity-40"
              style={{ background: colors[200] }}
            ></div>
          </div>
        </div>
      </div>

      <div
        id="mouse-gradient"
        ref={gradientRef}
        className="pointer-events-none fixed h-96 w-96 rounded-full opacity-0 blur-3xl transition-all duration-500 ease-out"
        style={{
          background: `radial-gradient(circle, ${colors[500]}0D 0%, transparent 100%)`,
        }}
      ></div>
    </div>
  );
}
