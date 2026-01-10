"use client"; // Required for interactivity

import { useState } from "react";

interface FaqItemProps {
  question: string;
  answer: string;
}

export default function FaqItem({ question, answer }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`faq-item ${isOpen ? "open" : ""}`}
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="faq-question">
        <h3>{question}</h3>
        {/* The Plus/Minus Icon */}
        <div className="icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {/* Horizontal line (always visible) */}
            <line x1="12" y1="5" x2="12" y2="19" className="vertical-line" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
      </div>

      <div className="faq-answer">
        <div className="answer-content">
          <p>{answer}</p>
        </div>
      </div>
    </div>
  );
}
