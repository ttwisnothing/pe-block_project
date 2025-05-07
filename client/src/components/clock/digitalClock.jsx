import React, { useState, useEffect } from "react";
import "./DigitalClock.css";

const DigitalClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-GB", { hour12: false });
  };

  return <div className="digital-clock">{formatTime(time)}</div>;
};

export default DigitalClock;
