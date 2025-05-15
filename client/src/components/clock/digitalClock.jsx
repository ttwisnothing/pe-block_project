import React, { useState, useEffect, useRef } from "react";
import "./DigitalClock.css";

const DigitalClock = React.memo(() => {
  const [time, setTime] = useState(() => new Date());
  const requestRef = useRef();

  useEffect(() => {
    const tick = () => {
      setTime(new Date());
      requestRef.current = setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    tick();
    return () => clearTimeout(requestRef.current);
  }, []);

  const formatTime = React.useCallback(
    (date) => date.toLocaleTimeString("en-GB", { hour12: false }),
    []
  );

  return <div className="digital-clock">{formatTime(time)}</div>;
});

export default DigitalClock;
