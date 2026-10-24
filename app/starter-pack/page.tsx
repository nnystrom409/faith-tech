export default function StarterPack() {
  return (
    <main>
      <h1>Host starter pack</h1>
      <p className="sub">Global Baptism Event · Pentecost, May 16, 2027 · test content for the hackathon demo</p>
      {[
        ["Planning checklist", "Date, time and venue · event lead and day-of contact · volunteer roles · reporting and follow-up owners."],
        ["Baptism preparation guide", "Prepare each candidate with your church's usual teaching and practice. Your church stays responsible for pastoral preparation."],
        ["Safe water and supervision", "Trained helpers in the water, a lifeguard or first-aider on site, and a plan for children and people with limited mobility."],
        ["Invite graphics", "Shareable images in English, Spanish, Portuguese and Tagalog."],
        ["Event-day guide", "Run of show, reporting your number by text, and photo and story permissions."],
        ["Follow-up resources", "A named person for every baptized person, and the 30-day discipleship guide."],
      ].map(([h, b]) => (
        <div className="card" key={h} style={{ marginBottom: 10 }}>
          <div className="label">{h}</div>
          <p style={{ margin: "4px 0 0" }}>{b}</p>
        </div>
      ))}
    </main>
  );
}
