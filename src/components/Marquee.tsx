const ITEMS = [
  "Residential Solar",
  "Commercial & Industrial",
  "Battery Storage",
  "EV Charging",
  "Solar Traffic Signals",
  "Smart Monitoring",
  "Maintenance & O&M",
  "Off-Grid Power",
];

export default function Marquee() {
  // The list is rendered twice so the -50% keyframe loops seamlessly.
  const track = [...ITEMS, ...ITEMS];

  return (
    <div className="marquee">
      <div className="mq-track" id="mqTrack">
        {track.map((item, i) => (
          <div className="mq-item" key={`${item}-${i}`}>
            <b>{item}</b>
            <span className="dot"></span>
          </div>
        ))}
      </div>
    </div>
  );
}
