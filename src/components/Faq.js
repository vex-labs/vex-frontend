// components/FAQ.js
import { useState } from "react";

const FAQ = () => {
  const [openFAQs, setOpenFAQs] = useState([]);

  const toggleFAQ = (index) => {
    if (openFAQs.includes(index)) {
      // If the clicked FAQ is already open, close it
      setOpenFAQs(openFAQs.filter((i) => i !== index));
    } else {
      // Otherwise, add it to the list of open FAQs
      setOpenFAQs([...openFAQs, index]);
    }
  };

  const faqData = [
    {
      question: "What is Next.js?",
      answer: "Next.js is a React framework that enables server-side rendering and static website generation for React applications."
    },
    {
      question: "How do I deploy a Next.js app?",
      answer: "You can deploy Next.js apps on platforms like Vercel, Netlify, or any server that supports Node.js."
    },
    {
      question: "What is server-side rendering (SSR)?",
      answer: "SSR is a method where a webpage is generated on the server and sent to the client, providing faster initial load times."
    }
  ];

  return (
    <div className="faq-container">
      {faqData.map((faq, index) => (
        <div key={index} className="faq-item">
          <div className="faq-question" onClick={() => toggleFAQ(index)}>
            {faq.question}
            <span className="faq-toggle">
              {openFAQs.includes(index) ? "-" : "+"}
            </span>
          </div>
          <div className={`faq-answer ${openFAQs.includes(index) ? "show" : ""}`}>
            {faq.answer}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FAQ;