import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="max-w-2xl w-full bg-white shadow-md rounded-lg overflow-hidden flex flex-col md:flex-row">
        <img
          src="/assets/c.jpg"
          alt="Maître Omar Iskandarani"
          className="w-full md:w-1/3 h-auto object-cover"
        />
        <div className="p-6 flex flex-col justify-center">
          <p className="text-gray-700 text-lg text-center md:text-left">
            Union Law Firm is a Beirut-based legal office led by Attorney Omar Iskandarani, a member of the Beirut Bar Association. With over 10 years of experience in family law, the firm provides professional legal services in divorce, custody, inheritance, and support matters. The firm is dedicated to serving both local and international clients with discretion, empathy, and legal excellence.
          </p>
          <p className="mt-4 text-base leading-relaxed text-gray-100">
            Driven by values of trust and transparency, Maître Omar Iskandarani combines a rigorous legal approach with a deep understanding of family issues. His mission: making law accessible, human, and tailored to each case.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;