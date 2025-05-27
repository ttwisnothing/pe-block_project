import React, { useState, useEffect, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import "./DigitalClock.css";

const DigitalClock = React.memo(({ showDate = true, showSeconds = true, is24Hour = true }) => {
  const [time, setTime] = useState(() => new Date());
  const requestRef = useRef();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const tick = () => {
      setTime(new Date());
      setAnimate(true);
      setTimeout(() => setAnimate(false), 500);
      
      // Sync with system second changes
      requestRef.current = setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    
    tick();
    return () => clearTimeout(requestRef.current);
  }, []);

  const formatTime = useMemo(() => {
    const options = {
      hour12: !is24Hour,
      hour: "2-digit",
      minute: "2-digit",
      ...(showSeconds && { second: "2-digit" }),
    };
    
    return time.toLocaleTimeString("en-GB", options);
  }, [time, is24Hour, showSeconds]);

  const formattedDate = useMemo(() => {
    return time.toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [time]);

  return (
    <div className={`digital-clock ${animate ? "pulse" : ""}`}>
      <div className="time">{formatTime}</div>
      {showDate && <div className="date">{formattedDate}</div>}
    </div>
  );
});

DigitalClock.propTypes = {
  showDate: PropTypes.bool,
  showSeconds: PropTypes.bool,
  is24Hour: PropTypes.bool,
};

export default DigitalClock;
