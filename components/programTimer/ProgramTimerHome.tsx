// components/programTimer/ProgramTimerHome.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Program } from "@/lib/programTimer/types";
import { ProgramCreateOverlay } from "./ProgramCreateOverlay";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { createProgramFromTemplate, type TemplateId } from "@/lib/programTimer/templates";
import { setLastStartedProgramId } from "@/lib/recentProgramTimer";

type ProgramTimerHomeProps = {
  templates: Program[];
  saved: Program[];
  onCreateNew: () => void;
  onRunProgram: (program: Program) => void;
  onEditProgram: (program: Program) => void;
  onDeleteProgram: (programId: string) => void;
  onSaveProgram?: (program: Program, autoRun: boolean) => void;
};

// Template Card Component
function TemplateCard({
  imageName,
  title,
  onStart,
  isMobile,
}: {
  imageName: string;
  title: string;
  onStart: () => void;
  isMobile: boolean;
}) {
  return (
    <div 
      className="relative aspect-square flex-shrink-0"
      style={{ 
        // Mobile: 450/1080 ≈ 41.7vw, use 40-45vw range
        width: isMobile ? "41.7vw" : "25vw",
        maxWidth: isMobile ? "none" : "300px",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      <Image
        src={`/image/${imageName}`}
        alt={title}
        fill
        className="object-cover"
        sizes={isMobile ? "41.7vw" : "25vw"}
        style={{ borderRadius: "10px" }}
      />
      {/* Start button - positioned bottom-right */}
      <button
        onClick={onStart}
        className="absolute text-white rounded-md font-semibold transition-colors shadow-lg hover:opacity-80"
        style={{
          bottom: "2%",
          right: "2%",
          padding: isMobile ? "1vh 2vw" : "0.7vw 1.2vw",
          fontSize: isMobile ? "clamp(0.875rem, 4vw, 1.125rem)" : "1.3vw",
          backgroundColor: "rgba(0, 228, 103, 0.7)",
        }}
      >
        Start
      </button>
    </div>
  );
}

// Saved Timer Row Component
function SavedTimerRow({
  program,
  onStart,
  onEdit,
  onDelete,
  isMobile,
}: {
  program: Program;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isMobile: boolean;
}) {
  return (
    <div 
      className="flex items-center justify-between w-full bg-white border border-black rounded-md gap-4"
      style={{
        width: isMobile ? "86.9vw" : "100%",
        height: isMobile ? "5.6vh" : "auto",
        padding: isMobile ? "1.2vh 3vw" : "1.5vh 2vw",
      }}
    >
      <span
        className="text-black font-medium flex-1 truncate"
        style={{ fontSize: isMobile ? "4vw" : "1.5vw" }}
      >
        {program.title || "Timer Name"}
      </span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onStart}
          className="bg-[#00E467] text-white rounded-md font-semibold hover:bg-[#00D15A] transition-colors whitespace-nowrap"
          style={{
            padding: isMobile ? "1.2vh 3vw" : "1vh 2vw",
            fontSize: isMobile ? "clamp(3vw, 3.5vw, 4vw)" : "1.2vw",
          }}
        >
          Start
        </button>
        <button
          onClick={onEdit}
          className="bg-[#0044FF] text-white rounded-md font-semibold hover:bg-[#0033CC] transition-colors whitespace-nowrap"
          style={{
            padding: isMobile ? "1.2vh 3vw" : "1vh 2vw",
            fontSize: isMobile ? "clamp(3vw, 3.5vw, 4vw)" : "1.2vw",
          }}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="bg-[#FFC5C5] text-black rounded-md font-semibold hover:bg-[#FFB0B0] transition-colors flex items-center gap-1 whitespace-nowrap"
          style={{
            padding: isMobile ? "1.2vh 3vw" : "1vh 2vw",
            fontSize: isMobile ? "clamp(3vw, 3.5vw, 4vw)" : "1.2vw",
          }}
        >
          <svg
            style={{ 
              width: isMobile ? "4vw" : "1.2vw", 
              height: isMobile ? "4vw" : "1.2vw",
              aspectRatio: "1/1",
            }}
            fill="none"
            stroke="red"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}

// Sidebar Component

export function ProgramTimerHome({
  templates: _templates,
  saved,
  onCreateNew,
  onRunProgram,
  onEditProgram,
  onDeleteProgram,
  onSaveProgram,
}: ProgramTimerHomeProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [initialProgram, setInitialProgram] = useState<Program | null>(null);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Template programs data (matching image names)
  // Stable template IDs: "template:tachiwaza", "template:ne-waza", "template:judo-training"
  const templateData = [
    { imageName: "template_tachiwaza.png", title: "Tachi-waza", templateId: "template:tachiwaza" as TemplateId },
    { imageName: "template_ne-waza.png", title: "Ne-waza", templateId: "template:ne-waza" as TemplateId },
    { imageName: "template_training.png", title: "Judo Training", templateId: "template:judo-training" as TemplateId },
  ];

  // Handle create new timer - open overlay instead of calling onCreateNew directly
  const handleCreateNew = () => {
    setInitialProgram(null);
    setIsCreateOpen(true);
  };

  // Handle overlay close
  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setInitialProgram(null);
  };

  // Handle save from overlay - call parent's onSaveProgram if available, otherwise fallback
  const handleSaveProgram = (program: Program, autoRun: boolean) => {
    if (onSaveProgram) {
      onSaveProgram(program, autoRun);
    } else {
      // Fallback: call parent's onCreateNew (existing pipeline)
      onCreateNew();
    }
    setIsCreateOpen(false);
  };

  return (
    <div
      className="bg-white overflow-hidden flex flex-col"
      style={{ 
        width: "100vw", 
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1,
      }}
    >
      {/* Header */}
      <header
        className="w-full bg-[#2B00FF] flex items-center shrink-0"
        style={{ 
          height: "calc(100vh * (100 / 1024))",
          paddingLeft: isMobile ? "3vw" : "2vw",
        }}
      >
        <div className="flex items-center" style={{ gap: isMobile ? "3vw" : "2vw" }}>
          {/* Hamburger menu button (mobile only) */}
          {isMobile && (
          <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex-shrink-0 text-white"
              aria-label="Open menu"
              style={{
                width: "9vw",
                height: "9vw",
                minWidth: "30px",
                minHeight: "30px",
              }}
            >
              <svg
                style={{ width: "100%", height: "100%" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
          </button>
          )}
          
          <div
            className="relative flex-shrink-0"
            style={{
              width: "calc(100vh * (100 / 1024) * 0.6)",
              height: "calc(100vh * (100 / 1024) * 0.6)",
              aspectRatio: "1/1",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <Image
              src="/image/program_timer_icon.png"
              alt="Program Timer"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-white font-semibold" style={{ fontSize: isMobile ? "clamp(1rem, 7vw, 1.5rem)" : "2.5vw" }}>
            Program Timer
                        </span>
                      </div>
      </header>

      {/* Main Layout: Sidebar + Content */}
      <div 
        className="flex flex-1 overflow-hidden" 
        style={{ 
          height: "calc(100vh - calc(100vh * (100 / 1024)))",
          minHeight: 0,
        }}
      >
        {/* Sidebar (PC: fixed, Mobile: drawer) */}
        <AppSidebar
          activeItem="program"
          isMobile={isMobile}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main 
          className="flex-1 flex flex-col overflow-hidden" 
          style={{ 
            maxWidth: "100%",
            padding: "0.8vh 2vw",
            minHeight: 0,
          }}
        >
          {/* Template Section */}
          <section className="flex-shrink-0" style={{ marginBottom:isMobile ? "4vh" :"2vh" }}>
            <h2 
              className="text-black font-bold" 
              style={{ 
                fontSize: isMobile ? "7vw" : "3vw",
                marginBottom:"1vh",
              }}
            >
              Template
            </h2>
            {/* Mobile: horizontal scrollable, PC: static row */}
            <div 
              className="flex flex-nowrap overflow-x-auto overflow-y-hidden md:flex-row md:overflow-x-visible md:overflow-y-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              style={{ 
                gap: isMobile ? "4vw" : "5vw",
                paddingLeft: isMobile ? "2vw" : "0",
                paddingRight: isMobile ? "2vw" : "0",
                scrollSnapType: isMobile ? "x mandatory" : "none",
                touchAction: "pan-x",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {templateData.map((template) => (
                <div
                  key={template.imageName}
                  style={{
                    scrollSnapAlign: isMobile ? "start" : "none",
                  }}
                >
                  <TemplateCard
                    imageName={template.imageName}
                    title={template.title}
                    isMobile={isMobile}
                    onStart={() => {
                      try {
                        const program = createProgramFromTemplate(template.templateId);
                        setInitialProgram(program);
                        setIsCreateOpen(true);
                      } catch (e) {
                        console.error("Failed to create program from template", e);
                      }
                    }}
                  />
                </div>
              ))}
                      </div>
          </section>

          {/* Saved Timer Section */}
          <section className="flex-1 flex flex-col min-h-0">
            {/* Section Header with Create Button */}
            <div 
              className="flex flex-row flex-wrap items-center justify-between flex-shrink-0"
              style={{ 
                gap: "2vw",
                marginBottom: isMobile ? "1vh" :"0vh",
              }}
            >
              <h2 
                className="text-black font-bold" 
                style={{ fontSize: isMobile ? "7vw" : "3vw" }}
              >
                Saved Timer
              </h2>
                        <button
                onClick={handleCreateNew}
                className="bg-[#0044FF] text-white rounded-md font-semibold hover:bg-[#0033CC] transition-colors whitespace-nowrap"
                style={{ 
                  padding:isMobile ? "1vh 2vw" : "1.5vh 2vw",
                  fontSize: isMobile ? "4vw" : "1.5vw",
                }}
                        >
                + Create Timer
                        </button>
                      </div>

            {/* Saved Timer List - Scrollable */}
            <div
              className="overflow-y-auto border border-gray-300 rounded-lg bg-gray-50"
              style={{
                width: isMobile ? "95.4vw" : "calc(100vw * (1138 / 1440))",
                maxWidth: isMobile ? "95.4vw" : "calc(100vw * (1138 / 1440))",
                height: isMobile ? "51vh" : "calc(100vh * (428 / 1024))",
                padding: isMobile ? "2vh 3vw" : "2vh 2vw",
                margin: isMobile ? "0 auto" : undefined,
              }}
            >
              {saved.length === 0 ? (
                <p 
                  className="text-gray-500 text-center" 
                  style={{ 
                    padding: "4vh 0",
                    fontSize:isMobile ? "5vw" : "1.5vw",
                  }}
                >
                  No saved timers yet.
                </p>
              ) : (
                <div className="flex flex-col" style={{ gap: "1.5vh" }}>
                  {saved.slice(0, 10).map((program) => (
                    <SavedTimerRow
                      key={program.id}
                      program={program}
                      onStart={() => {
                        // Store the program ID
                        setLastStartedProgramId(program.id);
                        onRunProgram(program);
                      }}
                      onEdit={() => onEditProgram(program)}
                      onDelete={() => onDeleteProgram(program.id)}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
        </div>

      {/* ProgramCreateOverlay - In-page overlay */}
      {isCreateOpen && (
        <ProgramCreateOverlay
          onClose={handleCloseCreate}
          onSave={handleSaveProgram}
          initialProgram={initialProgram}
        />
      )}
    </div>
  );
}
