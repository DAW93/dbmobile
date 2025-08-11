
import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string;
  onComplete: () => void;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, onComplete, className }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }
    
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      const totalSeconds = newTimeLeft.days * 86400 + newTimeLeft.hours * 3600 + newTimeLeft.minutes * 60 + newTimeLeft.seconds;
      if (totalSeconds <= 0) {
          onComplete();
      }
    }, 1000);

    return () => clearTimeout(timer);
  });

  const format = (num: number) => num.toString().padStart(2, '0');

  const timerClasses = className || "text-sm font-mono text-yellow-400 bg-gray-800 px-2 py-1 rounded";

  return (
    <div className={timerClasses}>
      {timeLeft.days > 0 && <span>{format(timeLeft.days)}d </span>}
      <span>{format(timeLeft.hours)}h </span>
      <span>{format(timeLeft.minutes)}m </span>
      <span>{format(timeLeft.seconds)}s</span>
    </div>
  );
};

export default CountdownTimer;
